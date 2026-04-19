# ============================================================
# inference.py — service prediksi harga saham
# Alur: load artifact -> bangun fitur terbaru -> scale -> ensemble RF + LR -> hasil
# ============================================================

import logging  # log
import pickle  # buat load model tersimpan
from pathlib import Path  # manipulasi path file

import pandas as pd  # dataframe

from .config import PriceModelConfig  # konfigurasi model (ticker, lag, dll)
from .features import PriceFeatureBuilder  # builder fitur harga
from .fundamental import FundamentalScorer  # scorer rule-based fundamental
from .training import PriceModelTrainer  # trainer model

logger = logging.getLogger(__name__)  # logger modul

# folder tempat artifact .pkl disimpen
ARTIFACTS_DIR = Path(__file__).resolve().parent / "models"


class StockPredictionService:
    def __init__(self, config: PriceModelConfig, historical_df=None):
        self.config = config  # simpen config
        self.historical_df = historical_df  # DataFrame history (optional override)
        self.trainer = None  # instance trainer (lazy)
        self.artifact = None  # artifact model (lazy)
        self.dataset = None  # dataset fitur (lazy)
        self.latest_completed_close = None  # close terakhir yg udah settle

    def _artifact_path(self):
        # path file artifact (pakai nama dari config)
        return ARTIFACTS_DIR / self.config.artifact_name

    def load_artifact(self):
        # load model dari disk — balik None kalau belum ada
        path = self._artifact_path()
        if not path.exists():
            return None
        with path.open("rb") as fh:  # buka binary read
            return pickle.load(fh)  # unpickle

    def train_runtime_model(self):
        # train model on-the-fly kalau artifact belum ada
        trainer = PriceModelTrainer(self.config, historical_df=self.historical_df)
        if not trainer.fit():  # gagal train -> None
            return None
        # simpen state setelah sukses
        self.trainer = trainer
        self.artifact = trainer.build_artifact()
        self.dataset = trainer.dataset
        self.latest_completed_close = trainer.latest_completed_close
        return self.artifact

    def ensure_runtime_artifact(self):
        # jamin artifact ada — load dulu, kalau gak ada train baru
        artifact = self.load_artifact()
        if artifact:
            self.artifact = artifact
            return artifact
        # belum ada file -> train di runtime
        artifact = self.train_runtime_model()
        return artifact

    def predict(self):
        # main function — balik hasil prediksi lengkap
        artifact = self.ensure_runtime_artifact()
        if not artifact:  # gagal dapet artifact
            return None

        # ambil harga close terakhir (buat baseline konversi return -> price)
        current_price_meta = self.latest_completed_close or artifact.get("latest_completed_close")
        if not current_price_meta:
            logger.error("Latest completed close tidak tersedia untuk %s", self.config.ticker)
            return None

        # bangun dataset fitur terbaru
        feature_builder = PriceFeatureBuilder(self.config, historical_df=self.historical_df)
        dataset, latest_completed_close = feature_builder.prepare_price_dataset()
        if dataset is None or dataset.empty:  # dataset kosong
            return None

        # ambil baris terakhir = fitur buat prediksi hari berikutnya
        latest_features_row = dataset.iloc[-1]
        feature_columns = artifact["feature_columns"]  # daftar fitur yg dipake pas training
        # reshape ke 2D array buat sklearn
        X_latest = latest_features_row[feature_columns].to_frame().T.values
        # standardize pake scaler yg sama dengan training
        X_latest_scaled = artifact["scaler"].transform(X_latest)

        current_price = float(latest_completed_close["close"])  # harga sekarang
        # predict return dari kedua model
        rf_pred_return = float(artifact["rf_model"].predict(X_latest_scaled)[0])  # Random Forest
        lr_pred_return = float(artifact["lr_model"].predict(X_latest_scaled)[0])  # Linear Regression

        # konversi return -> harga absolut
        rf_pred_price = current_price * (1 + rf_pred_return)
        lr_pred_price = current_price * (1 + lr_pred_return)
        ensemble_weights = artifact["ensemble_weights"]  # bobot ensemble (optimal dari training)

        # ensemble: rata-rata tertimbang dari RF & LR
        predicted_close = (
            rf_pred_price * ensemble_weights["rf"]
            + lr_pred_price * ensemble_weights["lr"]
        )

        # hitung persentase perubahan prediksi
        price_change_pct = ((predicted_close - current_price) / current_price) * 100 if current_price else 0.0
        # mapping ke rekomendasi sederhana (harga doang)
        price_recommendation = "HOLD"
        if price_change_pct >= 3:  # naik >=3% -> BUY
            price_recommendation = "BUY"
        elif price_change_pct <= -3:  # turun <=-3% -> SELL
            price_recommendation = "SELL"

        # panggil scorer fundamental buat analisis jangka menengah
        fundamental_view = FundamentalScorer(self.config.ticker).score(current_price)

        # balikin response lengkap (frontend konsumsi ini)
        return {
            "ticker": self.config.ticker,
            "prediction_horizon_days": self.config.forecast_horizon,
            "predicted_close_next_day": float(round(predicted_close, 2)),
            "rf_prediction": float(round(rf_pred_price, 2)),  # detail RF
            "lr_prediction": float(round(lr_pred_price, 2)),  # detail LR
            "ensemble_weights": ensemble_weights,  # bobot ensemble
            "current_price": float(round(current_price, 2)),  # harga baseline
            "current_price_date": latest_completed_close["date"],  # tgl baseline
            "price_expected_change_pct": float(round(price_change_pct, 2)),
            "price_recommendation": price_recommendation,
            "mape": float(round(artifact["metrics"]["mape"], 4)),  # akurasi model
            "fundamental_prediction": fundamental_view,  # hasil scorer fundamental
            "prediction_date": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S"),  # waktu prediksi
            "features_used": {  # metadata fitur — buat transparansi
                "price_model": {
                    "model": ["Random Forest", "Linear Regression"],
                    "features": feature_columns,
                    "target": f"return {self.config.forecast_horizon} trading day ahead",
                },
                "fundamental_model": {
                    "type": "rule-based fundamental scoring",
                    "features": ["EPS", "ROE", "PBV", "PER"],
                    "target": "estimated return 3 months, direction, recommendation",
                },
            },
            "validation": {  # metrik validasi — buat evaluasi model
                "train_size": artifact["metrics"]["train_size"],
                "test_size": artifact["metrics"]["test_size"],
                "evaluation_method": artifact["metrics"]["evaluation_method"],
                "price_metric_basis": artifact["metrics"]["price_metric_basis"],
                "accuracy_metric": artifact["metrics"]["accuracy_metric"],
                "mape": artifact["metrics"].get("mape"),
                "baseline_mape": artifact["metrics"].get("baseline_mape"),
                "directional_accuracy": artifact["metrics"].get("directional_accuracy"),
                "baseline_directional_accuracy": artifact["metrics"].get("baseline_directional_accuracy"),
                "baseline_method": artifact["metrics"].get("baseline_method"),
                "model_beats_baseline": artifact["metrics"].get("model_beats_baseline"),
                "walk_forward": artifact["metrics"].get("walk_forward"),
            },
        }


def predict_stock_price(ticker, days=730, forecast_horizon=1, lag_days=15, cutoff_date=None, historical_df=None):
    # wrapper fungsi — dipanggil dari route
    try:
        # rakit config dari parameter
        config = PriceModelConfig(
            ticker=ticker,
            days=days,  # berapa hari history dipake (default 2 tahun)
            forecast_horizon=forecast_horizon,  # prediksi berapa hari ke depan
            lag_days=lag_days,  # berapa hari lag buat fitur
            cutoff_date=cutoff_date,  # cutoff buat backtesting
        )
        service = StockPredictionService(config, historical_df=historical_df)
        return service.predict()  # eksekusi & balikin hasil
    except Exception as exc:  # error tak terduga
        logger.error("Error in predict_stock_price for %s: %s", ticker, str(exc))
        return None  # balikin None biar caller handle
