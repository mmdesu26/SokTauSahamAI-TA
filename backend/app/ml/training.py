import logging  # Untuk logging error/info
import pickle  # Untuk menyimpan model ke file (.pkl)
from pathlib import Path  # Untuk manipulasi path file

import numpy as np  # Operasi numerik
from sklearn.ensemble import RandomForestRegressor  # Model Random Forest
from sklearn.linear_model import LinearRegression  # Model Linear Regression
from sklearn.metrics import mean_squared_error  # Evaluasi error
from sklearn.preprocessing import StandardScaler  # Normalisasi fitur

from .config import PriceModelConfig  # Konfigurasi model
from .features import PriceFeatureBuilder  # Builder fitur dari data harga

logger = logging.getLogger(__name__)


class PriceModelTrainer:
    # Class utama untuk:
    # - Menyiapkan dataset
    # - Melatih model ML
    # - Evaluasi performa
    # - Menyimpan model

    def __init__(self, config: PriceModelConfig, historical_df=None):
        self.config = config

        # Builder fitur dari data historis
        self.feature_builder = PriceFeatureBuilder(config, historical_df=historical_df)

        # Nama kolom fitur yang akan dipakai model
        self.feature_columns = self.feature_builder.build_feature_columns()

        # Normalisasi fitur
        self.scaler = StandardScaler()

        # Model utama: Random Forest
        self.rf_model = RandomForestRegressor(
            n_estimators=400,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        )

        # Model tambahan: Linear Regression
        self.lr_model = LinearRegression()

        # Variabel internal
        self.dataset = None
        self.latest_completed_close = None
        self.metrics = None

        # Bobot ensemble awal (akan diupdate setelah training)
        self.ensemble_weights = {"rf": 0.5, "lr": 0.5}

    def prepare_dataset(self):
        # Ambil dataset dari feature builder
        dataset, latest_completed_close = self.feature_builder.prepare_price_dataset()
        self.dataset = dataset
        self.latest_completed_close = latest_completed_close
        return dataset

    def time_series_split(self, df):
        # Split data train-test berdasarkan waktu (bukan random!)
        split_idx = int(len(df) * self.config.train_ratio)

        train_df = df.iloc[:split_idx].copy()
        test_df = df.iloc[split_idx:].copy()

        # Validasi ukuran minimal
        if len(train_df) < 60 or len(test_df) < 20:
            logger.error("Ukuran train/test tidak memadai untuk %s", self.config.ticker)
            return None, None

        return train_df, test_df

    @staticmethod
    def calculate_mape(actual_prices, predicted_prices):
        # Menghitung Mean Absolute Percentage Error (MAPE)
        actual_arr = np.asarray(actual_prices, dtype=float)
        pred_arr = np.asarray(predicted_prices, dtype=float)

        # Hindari pembagian dengan nol
        actual_safe = np.where(np.abs(actual_arr) < 1e-8, 1e-8, actual_arr)

        return float(np.mean(np.abs((actual_arr - pred_arr) / actual_safe)) * 100)

    @staticmethod
    def calculate_directional_accuracy(actual_returns, predicted_returns):
        # Mengukur seberapa sering arah prediksi benar (naik/turun)
        actual_arr = np.asarray(actual_returns, dtype=float)
        pred_arr = np.asarray(predicted_returns, dtype=float)

        if actual_arr.size == 0:
            return 0.0

        actual_sign = np.sign(actual_arr)
        pred_sign = np.sign(pred_arr)

        correct = actual_sign == pred_sign
        return float(np.mean(correct) * 100)

    @staticmethod
    def baseline_price_from_current_close(current_close):
        # Baseline: prediksi harga besok = harga hari ini
        return np.asarray(current_close, dtype=float)

    def _fit_models_for_split(self, train_df, test_df):
        # Training model untuk satu split data

        X_train = train_df[self.feature_columns].values
        X_test = test_df[self.feature_columns].values

        y_train = train_df["target_return_future"].values
        y_test_return = test_df["target_return_future"].values

        # Scaling fitur
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        # Inisialisasi model
        rf_model = RandomForestRegressor(...)
        lr_model = LinearRegression()

        # Training
        rf_model.fit(X_train_scaled, y_train)
        lr_model.fit(X_train_scaled, y_train)

        # Prediksi return
        rf_pred_return = rf_model.predict(X_test_scaled)
        lr_pred_return = lr_model.predict(X_test_scaled)

        # Konversi return → harga
        current_close = test_df["close"].values
        actual_price = current_close * (1 + y_test_return)
        rf_pred_price = current_close * (1 + rf_pred_return)
        lr_pred_price = current_close * (1 + lr_pred_return)

        # Hitung error (RMSE)
        rf_rmse = np.sqrt(mean_squared_error(actual_price, rf_pred_price))
        lr_rmse = np.sqrt(mean_squared_error(actual_price, lr_pred_price))

        # Hitung bobot ensemble (model lebih bagus → bobot lebih besar)
        inv_rf = 1 / max(rf_rmse, 1e-8)
        inv_lr = 1 / max(lr_rmse, 1e-8)

        total = inv_rf + inv_lr
        rf_weight = inv_rf / total
        lr_weight = inv_lr / total

        # Ensemble prediksi
        ensemble_pred_return = rf_pred_return * rf_weight + lr_pred_return * lr_weight
        ensemble_pred_price = rf_pred_price * rf_weight + lr_pred_price * lr_weight

        return {
            # Model + hasil prediksi
            "scaler": scaler,
            "rf_model": rf_model,
            "lr_model": lr_model,
            "rf_weight": rf_weight,
            "lr_weight": lr_weight,
            "actual_price": actual_price,
            "actual_return": y_test_return,
            "ensemble_pred_price": ensemble_pred_price,
            "ensemble_pred_return": ensemble_pred_return,
        }

    def fit(self):
        # Proses utama training model

        df = self.prepare_dataset()
        if df is None:
            return False

        # Split data
        train_df, test_df = self.time_series_split(df)
        if train_df is None:
            return False

        # Training model
        result = self._fit_models_for_split(train_df, test_df)

        # Simpan model & scaler
        self.scaler = result["scaler"]
        self.rf_model = result["rf_model"]
        self.lr_model = result["lr_model"]

        # Evaluasi performa
        mape = self.calculate_mape(result["actual_price"], result["ensemble_pred_price"])
        directional_accuracy = self.calculate_directional_accuracy(
            result["actual_return"],
            result["ensemble_pred_return"]
        )

        # Simpan metrics
        self.metrics = {
            "mape": mape,
            "directional_accuracy": directional_accuracy,
        }

        return True

    def build_artifact(self):
        # Menggabungkan semua komponen model menjadi satu object
        if self.dataset is None or self.metrics is None:
            raise ValueError("Model belum dilatih.")

        return {
            "config": self.config,
            "feature_columns": self.feature_columns,
            "rf_model": self.rf_model,
            "lr_model": self.lr_model,
            "scaler": self.scaler,
            "ensemble_weights": self.ensemble_weights,
            "metrics": self.metrics,
            "latest_completed_close": self.latest_completed_close,
        }

    def save_artifact(self, directory: str | Path):
        # Menyimpan model ke file .pkl
        directory = Path(directory)
        directory.mkdir(parents=True, exist_ok=True)

        path = directory / self.config.artifact_name
        artifact = self.build_artifact()

        with path.open("wb") as fh:
            pickle.dump(artifact, fh)

        return path