import logging
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error, mean_squared_error
from sklearn.preprocessing import StandardScaler

from app.utils.yfinance_helper import YFinanceHelper

logger = logging.getLogger(__name__)


class StockPricePredictor:
    """
    Prediksi harga closing saham 1 bulan ke depan
    menggunakan Random Forest + Linear Regression
    dengan fitur fundamental saja: EPS, ROE, PBV, PER.
    """

    def __init__(self, ticker, days=720, forecast_horizon=20):
        self.ticker = ticker
        self.days = days
        self.forecast_horizon = forecast_horizon

        self.rf_model = RandomForestRegressor(
            n_estimators=300,
            max_depth=8,
            min_samples_leaf=3,
            random_state=42,
            n_jobs=-1
        )
        self.lr_model = LinearRegression()
        self.scaler = StandardScaler()

        # sesuai permintaan: hanya fundamental
        self.feature_columns = ["eps", "roe", "pbv", "per"]

        self.dataset = None
        self.metrics = None

    @staticmethod
    def _safe_float(value, default=0.0):
        try:
            if value is None or pd.isna(value):
                return default
            return float(value)
        except Exception:
            return default

    def prepare_dataset(self):
        hist_df = YFinanceHelper.get_historical_prices(
            self.ticker,
            days=self.days,
            exclude_today=True
        )

        if hist_df is None or hist_df.empty:
            logger.error("Data historis kosong untuk %s", self.ticker)
            return None

        fundamentals = YFinanceHelper.get_fundamentals(self.ticker) or {}

        if "Close" not in hist_df.columns:
            logger.error("Kolom Close tidak ditemukan untuk %s", self.ticker)
            return None

        df = hist_df[["Close"]].copy()
        df.columns = ["close"]

        # fitur fundamental saja
        eps = self._safe_float(fundamentals.get("eps"))
        roe = self._safe_float(fundamentals.get("roe"))
        pbv = self._safe_float(fundamentals.get("pbv"))
        per = self._safe_float(fundamentals.get("pe"))

        df["eps"] = eps
        df["roe"] = roe
        df["pbv"] = pbv
        df["per"] = per

        # target = closing 1 bulan ke depan (~20 hari bursa)
        df["target_close_1m"] = df["close"].shift(-self.forecast_horizon)

        df = df.replace([np.inf, -np.inf], np.nan).dropna().copy()

        if len(df) < 60:
            logger.error("Dataset terlalu sedikit setelah preprocessing untuk %s", self.ticker)
            return None

        return df

    def _time_series_split(self, df, train_ratio=0.8):
        split_idx = int(len(df) * train_ratio)

        train_df = df.iloc[:split_idx].copy()
        test_df = df.iloc[split_idx:].copy()

        if len(train_df) < 30 or len(test_df) < 10:
            return None, None

        return train_df, test_df

    def train(self):
        df = self.prepare_dataset()
        if df is None or df.empty:
            return False

        train_df, test_df = self._time_series_split(df)
        if train_df is None or test_df is None:
            logger.error("Gagal split dataset time-series untuk %s", self.ticker)
            return False

        X_train = train_df[self.feature_columns].values
        y_train = train_df["target_close_1m"].values

        X_test = test_df[self.feature_columns].values
        y_test = test_df["target_close_1m"].values

        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        self.rf_model.fit(X_train_scaled, y_train)
        self.lr_model.fit(X_train_scaled, y_train)

        rf_pred = self.rf_model.predict(X_test_scaled)
        lr_pred = self.lr_model.predict(X_test_scaled)

        # sesuai alur sistem: RF 60%, LR 40%
        ensemble_pred = (rf_pred * 0.6) + (lr_pred * 0.4)

        mse = float(mean_squared_error(y_test, ensemble_pred))
        rmse = float(np.sqrt(mse))
        mae = float(mean_absolute_error(y_test, ensemble_pred))
        mape = float(mean_absolute_percentage_error(y_test, ensemble_pred) * 100)

        self.dataset = df
        self.metrics = {
            "mse": mse,
            "rmse": rmse,
            "mae": mae,
            "mape": mape,
            "train_size": int(len(train_df)),
            "test_size": int(len(test_df)),
        }

        return True

    def predict_next_month(self):
        if self.dataset is None and not self.train():
            return None

        latest = self.dataset.iloc[-1]
        X_latest = latest[self.feature_columns].to_frame().T.values
        X_latest_scaled = self.scaler.transform(X_latest)

        rf_pred = float(self.rf_model.predict(X_latest_scaled)[0])
        lr_pred = float(self.lr_model.predict(X_latest_scaled)[0])

        predicted_close = (rf_pred * 0.6) + (lr_pred * 0.4)

        current_price = float(latest["close"])
        expected_change_pct = (
            ((predicted_close - current_price) / current_price) * 100
            if current_price else 0
        )

        recommendation = "HOLD"
        if expected_change_pct >= 3:
            recommendation = "BUY"
        elif expected_change_pct <= -3:
            recommendation = "SELL"

        return {
            "ticker": self.ticker,
            "prediction_horizon_days": self.forecast_horizon,
            "predicted_close_1m": float(round(predicted_close, 2)),
            "rf_prediction": float(round(rf_pred, 2)),
            "lr_prediction": float(round(lr_pred, 2)),
            "ensemble_weights": {
                "rf": 0.6,
                "lr": 0.4,
            },
            "current_price": float(round(current_price, 2)),
            "expected_change_pct": float(round(expected_change_pct, 2)),
            "recommendation": recommendation,
            "mse": float(round(self.metrics["mse"], 4)),
            "rmse": float(round(self.metrics["rmse"], 4)),
            "mae": float(round(self.metrics["mae"], 4)),
            "mape": float(round(self.metrics["mape"], 4)),
            "prediction_date": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S"),
            "features_used": {
                "model": ["Random Forest", "Linear Regression"],
                "fundamentals": ["EPS", "ROE", "PBV", "PER"],
            },
            "validation": {
                "train_size": self.metrics["train_size"],
                "test_size": self.metrics["test_size"],
                "evaluation_method": "time-series holdout split",
                "target": "closing price 1 month ahead",
            }
        }


def predict_stock_price(ticker):
    try:
        predictor = StockPricePredictor(ticker=ticker)
        if not predictor.train():
            return None
        return predictor.predict_next_month()
    except Exception as e:
        logger.error("Error in predict_stock_price for %s: %s", ticker, str(e))
        return None