"""
Compatibility wrapper untuk modul ML yang sudah dipisah.

Tujuan:
- Menjaga backward compatibility (kompatibilitas lama)
- Supaya import lama tetap bisa dipakai tanpa error

Contoh import lama:
    from app.utils.ml_predictor import predict_stock_price, StockPricePredictor

Padahal sekarang modul sudah dipisah ke:
    app.ml.config
    app.ml.training
    app.ml.inference
"""

# Import konfigurasi model
from app.ml.config import PriceModelConfig

# Import service inference (prediksi) dan fungsi helper
from app.ml.inference import StockPredictionService, predict_stock_price

# Import trainer untuk training model
from app.ml.training import PriceModelTrainer


class StockPricePredictor:
    """
    Wrapper class untuk menyatukan:
    - Config
    - Training
    - Prediction (inference)

    Tujuannya:
    - Menyederhanakan penggunaan ML dari luar
    - Menjadi interface tunggal (facade pattern)
    """

    def __init__(
        self,
        ticker,
        days=730,
        forecast_horizon=1,
        lag_days=15,
        cutoff_date=None,
        historical_df=None,
    ):
        """
        Inisialisasi predictor

        Parameter:
        - ticker: kode saham (contoh: BBCA, AAPL)
        - days: jumlah hari data historis
        - forecast_horizon: prediksi berapa hari ke depan
        - lag_days: jumlah fitur lag
        - cutoff_date: batas data historis
        - historical_df: optional dataframe manual (override API)
        """

        # Membuat config model
        self.config = PriceModelConfig(
            ticker=ticker,
            days=days,
            forecast_horizon=forecast_horizon,
            lag_days=lag_days,
            cutoff_date=cutoff_date,
        )

        # Data historis opsional (kalau tidak mau ambil dari API)
        self.historical_df = historical_df

        # Trainer → untuk melatih model
        self.trainer = PriceModelTrainer(self.config, historical_df=historical_df)

        # Service → untuk inference/prediksi
        self.service = StockPredictionService(self.config, historical_df=historical_df)

        # Variabel internal
        self.dataset = None  # dataset hasil preprocessing
        self.latest_completed_close = None  # harga terakhir
        self.metrics = None  # hasil evaluasi model

        # Default bobot ensemble (akan diupdate setelah training)
        self.ensemble_weights = {"rf": 0.5, "lr": 0.5}

        # Daftar fitur harga (diambil dari trainer)
        self.price_feature_columns = self.trainer.feature_columns

    def train_price_model(self):
        """
        Melatih model harga saham

        Flow:
        1. Jalankan trainer.fit()
        2. Ambil hasil training (dataset, metrics, dll)
        """

        # Jalankan proses training
        success = self.trainer.fit()

        # Jika gagal training
        if not success:
            return False

        # Simpan hasil training ke wrapper
        self.dataset = self.trainer.dataset
        self.latest_completed_close = self.trainer.latest_completed_close
        self.metrics = self.trainer.metrics
        self.ensemble_weights = self.trainer.ensemble_weights

        return True

    def predict_next_period(self):
        """
        Melakukan prediksi harga periode berikutnya

        Flow:
        1. Jika belum training → lakukan training dulu
        2. Set service dengan hasil training
        3. Jalankan prediksi
        """

        # Jika belum ada dataset (belum training)
        if self.dataset is None:
            trained = self.train_price_model()

            # Jika training gagal → return None
            if not trained:
                return None

        # Inject hasil training ke service inference
        self.service.trainer = self.trainer

        # Artifact = bundle model + config + scaler
        self.service.artifact = self.trainer.build_artifact()

        # Dataset hasil preprocessing
        self.service.dataset = self.trainer.dataset

        # Harga terakhir
        self.service.latest_completed_close = self.trainer.latest_completed_close

        # Jalankan prediksi
        return self.service.predict()