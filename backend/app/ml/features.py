import logging  # Untuk mencatat log error/info saat proses berjalan
import numpy as np  # Untuk operasi numerik
import pandas as pd  # Untuk manipulasi data tabel/dataframe

from app.utils.yfinance_helper import YFinanceHelper  # Helper untuk ambil data historis saham dari Yahoo Finance
from .config import PriceModelConfig  # Import konfigurasi model harga

logger = logging.getLogger(__name__)  # Membuat logger sesuai nama module saat ini


class PriceFeatureBuilder:
    # Class ini bertugas mengambil data historis harga saham
    # lalu mengubahnya menjadi dataset fitur untuk training/prediksi model
    def __init__(self, config: PriceModelConfig, historical_df=None):
        self.config = config  # Menyimpan konfigurasi model
        self.historical_df = historical_df  # Opsional: dataframe historis manual jika tidak ingin fetch dari API

    def build_feature_columns(self):
        # Membuat daftar nama kolom fitur yang akan dipakai model
        feature_cols = []

        # Menambahkan fitur lag harga penutupan
        for i in range(1, self.config.lag_days + 1):
            feature_cols.append(f"lag_close_{i}")

        # Menambahkan fitur lag return harian
        for i in range(1, self.config.lag_days + 1):
            feature_cols.append(f"lag_return_{i}")

        # Menambahkan fitur lag volume
        for i in range(1, self.config.lag_days + 1):
            feature_cols.append(f"lag_volume_{i}")

        # Menambahkan fitur tambahan harian
        feature_cols.extend(["daily_range", "open_close_change", "volume_change"])

        return feature_cols

    @staticmethod
    def coerce_date(value):
        # Mengubah input menjadi object date jika memungkinkan
        # Jika kosong atau tidak valid, kembalikan None
        if value in (None, ""):
            return None
        try:
            return pd.Timestamp(value).date()
        except Exception:
            return None

    def get_source_history(self):
        # Mengambil data historis dari dataframe yang diberikan
        # atau fetch langsung dari Yahoo Finance jika tidak ada
        if self.historical_df is not None:
            hist_df = self.historical_df.copy()
        else:
            hist_df = YFinanceHelper.get_historical_prices(
                self.config.ticker,
                days=self.config.days,
                exclude_today=True,
            )

        # Validasi jika data kosong
        if hist_df is None or hist_df.empty:
            logger.error("Data historis kosong untuk %s", self.config.ticker)
            return None

        # Pastikan data urut berdasarkan index/tanggal
        hist_df = hist_df.copy().sort_index()

        # Filter berdasarkan cutoff_date jika ada
        cutoff_date = self.coerce_date(self.config.cutoff_date)
        if cutoff_date is not None:
            hist_df = hist_df[hist_df.index.date <= cutoff_date]

        # Ambil hanya sejumlah hari terakhir sesuai config.days
        if self.config.days and len(hist_df) > self.config.days:
            hist_df = hist_df.tail(self.config.days)

        # Cek lagi apakah data kosong setelah filtering
        if hist_df.empty:
            logger.error("Data historis kosong setelah filtering cutoff untuk %s", self.config.ticker)
            return None

        # Validasi kolom wajib
        required_cols = {"Open", "High", "Low", "Close", "Volume"}
        missing_cols = required_cols - set(hist_df.columns)
        if missing_cols:
            logger.error(
                "Kolom historis tidak lengkap untuk %s. Missing: %s",
                self.config.ticker,
                ", ".join(sorted(missing_cols)),
            )
            return None

        return hist_df

    def prepare_price_dataset(self):
        # Menyiapkan dataset akhir untuk model dari data historis
        hist_df = self.get_source_history()
        if hist_df is None or hist_df.empty:
            return None, None

        # Menyimpan informasi harga close terakhir yang sudah lengkap
        latest_completed_close = {
            "date": hist_df.index[-1].strftime("%Y-%m-%d"),
            "close": float(hist_df.iloc[-1]["Close"]),
        }

        # Ambil kolom penting lalu ubah nama kolom menjadi lowercase
        df = hist_df[["Open", "High", "Low", "Close", "Volume"]].copy()
        df.columns = ["open", "high", "low", "close", "volume"]

        # Pastikan semua kolom numerik valid
        for column in ["open", "high", "low", "close", "volume"]:
            df[column] = pd.to_numeric(df[column], errors="coerce")

        # Hitung return harian berdasarkan close
        df["return"] = df["close"].pct_change()

        # Hitung range harian: (high - low) / close
        # Jika close sangat kecil, isi 0 agar tidak error pembagian
        df["daily_range"] = np.where(
            np.abs(df["close"]) < 1e-8,
            0.0,
            (df["high"] - df["low"]) / df["close"],
        )

        # Hitung perubahan open ke close: (close - open) / open
        # Jika open sangat kecil, isi 0
        df["open_close_change"] = np.where(
            np.abs(df["open"]) < 1e-8,
            0.0,
            (df["close"] - df["open"]) / df["open"],
        )

        # Hitung perubahan volume harian
        df["volume_change"] = df["volume"].pct_change()

        # Membuat fitur lag untuk close, return, dan volume
        for i in range(1, self.config.lag_days + 1):
            df[f"lag_close_{i}"] = df["close"].shift(i)     # Harga close i hari sebelumnya
            df[f"lag_return_{i}"] = df["return"].shift(i)   # Return i hari sebelumnya
            df[f"lag_volume_{i}"] = df["volume"].shift(i)   # Volume i hari sebelumnya

        # Membuat target prediksi:
        # return masa depan berdasarkan forecast_horizon
        df["target_return_future"] = (
            df["close"].shift(-self.config.forecast_horizon) - df["close"]
        ) / df["close"]

        # Bersihkan nilai tak valid, lalu hapus baris yang mengandung NaN
        df = df.replace([np.inf, -np.inf], np.nan).dropna().copy()

        # Validasi jumlah data minimal agar model tetap layak dilatih
        if len(df) < 120:
            logger.error(
                "Dataset harga terlalu sedikit setelah preprocessing untuk %s",
                self.config.ticker,
            )
            return None, latest_completed_close

        return df, latest_completed_close