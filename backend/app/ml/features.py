import logging
import numpy as np
import pandas as pd

from app.utils.yfinance_helper import YFinanceHelper
from .config import PriceModelConfig

logger = logging.getLogger(__name__)


class PriceFeatureBuilder:
    def __init__(self, config: PriceModelConfig, historical_df=None):
        self.config = config
        self.historical_df = historical_df

    def build_feature_columns(self):
        feature_cols = []

        for i in range(1, self.config.lag_days + 1):
            feature_cols.append(f"lag_close_{i}")

        for i in range(1, self.config.lag_days + 1):
            feature_cols.append(f"lag_return_{i}")

        for i in range(1, self.config.lag_days + 1):
            feature_cols.append(f"lag_volume_{i}")

        feature_cols.extend(["daily_range", "open_close_change", "volume_change"])
        return feature_cols

    @staticmethod
    def coerce_date(value):
        if value in (None, ""):
            return None
        try:
            return pd.Timestamp(value).date()
        except Exception:
            return None

    def get_source_history(self):
        if self.historical_df is not None:
            hist_df = self.historical_df.copy()
        else:
            hist_df = YFinanceHelper.get_historical_prices(
                self.config.ticker,
                days=self.config.days,
                exclude_today=True,
            )

        if hist_df is None or hist_df.empty:
            logger.error("Data historis kosong untuk %s", self.config.ticker)
            return None

        hist_df = hist_df.copy().sort_index()

        cutoff_date = self.coerce_date(self.config.cutoff_date)
        if cutoff_date is not None:
            hist_df = hist_df[hist_df.index.date <= cutoff_date]

        if self.config.days and len(hist_df) > self.config.days:
            hist_df = hist_df.tail(self.config.days)

        if hist_df.empty:
            logger.error("Data historis kosong setelah filtering cutoff untuk %s", self.config.ticker)
            return None

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

    def _build_feature_frame(self, hist_df):
        df = hist_df[["Open", "High", "Low", "Close", "Volume"]].copy()
        df.columns = ["open", "high", "low", "close", "volume"]

        for column in ["open", "high", "low", "close", "volume"]:
            df[column] = pd.to_numeric(df[column], errors="coerce")

        df["return"] = df["close"].pct_change()

        df["daily_range"] = np.where(
            np.abs(df["close"]) < 1e-8,
            0.0,
            (df["high"] - df["low"]) / df["close"],
        )

        df["open_close_change"] = np.where(
            np.abs(df["open"]) < 1e-8,
            0.0,
            (df["close"] - df["open"]) / df["open"],
        )

        df["volume_change"] = df["volume"].pct_change()

        for i in range(1, self.config.lag_days + 1):
            df[f"lag_close_{i}"] = df["close"].shift(i)
            df[f"lag_return_{i}"] = df["return"].shift(i)
            df[f"lag_volume_{i}"] = df["volume"].shift(i)

        df["target_return_future"] = (
            df["close"].shift(-self.config.forecast_horizon) - df["close"]
        ) / df["close"]

        df = df.replace([np.inf, -np.inf], np.nan)
        return df

    def prepare_price_dataset(self):
        """
        Dipakai untuk TRAINING.
        Baris yang target_return_future-nya kosong harus dibuang.
        """
        hist_df = self.get_source_history()
        if hist_df is None or hist_df.empty:
            return None, None

        latest_completed_close = {
            "date": hist_df.index[-1].strftime("%Y-%m-%d"),
            "close": float(hist_df.iloc[-1]["Close"]),
        }

        df = self._build_feature_frame(hist_df)

        required_cols = self.build_feature_columns() + ["target_return_future"]
        df = df.dropna(subset=required_cols).copy()

        if len(df) < 120:
            logger.error(
                "Dataset harga terlalu sedikit setelah preprocessing untuk %s",
                self.config.ticker,
            )
            return None, latest_completed_close

        return df, latest_completed_close

    def prepare_prediction_dataset(self):
        """
        Dipakai untuk PREDIKSI.
        Baris terakhir tidak boleh dibuang hanya karena target_return_future kosong.
        """
        hist_df = self.get_source_history()
        if hist_df is None or hist_df.empty:
            return None, None

        latest_completed_close = {
            "date": hist_df.index[-1].strftime("%Y-%m-%d"),
            "close": float(hist_df.iloc[-1]["Close"]),
        }

        df = self._build_feature_frame(hist_df)

        required_cols = self.build_feature_columns()
        df = df.dropna(subset=required_cols).copy()

        if df.empty:
            logger.error(
                "Dataset prediksi kosong setelah preprocessing untuk %s",
                self.config.ticker,
            )
            return None, latest_completed_close

        return df, latest_completed_close