import logging
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.preprocessing import StandardScaler

from app.utils.yfinance_helper import YFinanceHelper

logger = logging.getLogger(__name__)


class StockPricePredictor:
    """
    SISTEM PREDIKSI DUAL-MODEL

    1) MODEL HARGA
       - Random Forest + Linear Regression
       - Prediksi harga closing 1 hari ke depan
       - Dilatih menggunakan target return 1 hari ke depan
       - Fitur: lag harga closing historis

    2) MODEL FUNDAMENTAL
       - Analisis fundamental untuk horizon 3 bulan
       - Output: estimasi return 3 bulan, arah, dan rekomendasi
       - Fitur: EPS, ROE, PBV, PER
    """

    def __init__(self, ticker, days=720, forecast_horizon=1, lag_days=10):
        self.ticker = ticker
        self.days = days
        self.forecast_horizon = forecast_horizon
        self.lag_days = lag_days

        self.rf_model = RandomForestRegressor(
            n_estimators=400,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        self.lr_model = LinearRegression()
        self.scaler = StandardScaler()

        self.dataset = None
        self.latest_completed_close = None
        self.metrics = None
        self.fundamentals = None
        self.ensemble_weights = {"rf": 0.5, "lr": 0.5}

        self.price_feature_columns = [
            f"lag_close_{i}" for i in range(1, self.lag_days + 1)
        ]

    @staticmethod
    def _safe_float(value, default=0.0):
        try:
            if value is None or pd.isna(value):
                return default
            return float(value)
        except Exception:
            return default

    def prepare_price_dataset(self):
        hist_df = YFinanceHelper.get_historical_prices(
            self.ticker,
            days=self.days,
            exclude_today=True
        )

        if hist_df is None or hist_df.empty:
            logger.error("Data historis kosong untuk %s", self.ticker)
            return None

        if "Close" not in hist_df.columns:
            logger.error("Kolom Close tidak ditemukan untuk %s", self.ticker)
            return None

        # simpan close trading terakhir yang completed sebelum proses shift/dropna
        self.latest_completed_close = {
            "date": hist_df.index[-1].strftime("%Y-%m-%d"),
            "close": float(hist_df.iloc[-1]["Close"]),
        }

        df = hist_df[["Close"]].copy()
        df.columns = ["close"]
        df["close"] = pd.to_numeric(df["close"], errors="coerce")

        for i in range(1, self.lag_days + 1):
            df[f"lag_close_{i}"] = df["close"].shift(i)

        df["target_return_future"] = (
            df["close"].shift(-self.forecast_horizon) - df["close"]
        ) / df["close"]

        df = df.replace([np.inf, -np.inf], np.nan).dropna().copy()

        if len(df) < 120:
            logger.error(
                "Dataset harga terlalu sedikit setelah preprocessing untuk %s",
                self.ticker
            )
            return None

        return df

    def _time_series_split(self, df, train_ratio=0.8):
        split_idx = int(len(df) * train_ratio)

        train_df = df.iloc[:split_idx].copy()
        test_df = df.iloc[split_idx:].copy()

        if len(train_df) < 60 or len(test_df) < 20:
            logger.error("Ukuran train/test tidak memadai untuk %s", self.ticker)
            return None, None

        return train_df, test_df

    def train_price_model(self):
        df = self.prepare_price_dataset()
        if df is None or df.empty:
            return False

        train_df, test_df = self._time_series_split(df)
        if train_df is None or test_df is None:
            return False

        X_train = train_df[self.price_feature_columns].values
        y_train = train_df["target_return_future"].values

        X_test = test_df[self.price_feature_columns].values
        y_test_return = test_df["target_return_future"].values

        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        self.rf_model.fit(X_train_scaled, y_train)
        self.lr_model.fit(X_train_scaled, y_train)

        rf_pred_return = self.rf_model.predict(X_test_scaled)
        lr_pred_return = self.lr_model.predict(X_test_scaled)

        current_close_test = test_df["close"].values
        y_test_price = current_close_test * (1 + y_test_return)
        rf_pred_price = current_close_test * (1 + rf_pred_return)
        lr_pred_price = current_close_test * (1 + lr_pred_return)

        rf_rmse = float(np.sqrt(mean_squared_error(y_test_price, rf_pred_price)))
        lr_rmse = float(np.sqrt(mean_squared_error(y_test_price, lr_pred_price)))

        eps = 1e-8
        inv_rf = 1.0 / max(rf_rmse, eps)
        inv_lr = 1.0 / max(lr_rmse, eps)
        weight_sum = inv_rf + inv_lr

        rf_weight = inv_rf / weight_sum
        lr_weight = inv_lr / weight_sum

        ensemble_pred_price = (rf_pred_price * rf_weight) + (lr_pred_price * lr_weight)

        mse = float(mean_squared_error(y_test_price, ensemble_pred_price))
        rmse = float(np.sqrt(mse))
        mae = float(mean_absolute_error(y_test_price, ensemble_pred_price))

        y_test_price_safe = np.where(np.abs(y_test_price) < 1e-8, 1e-8, y_test_price)
        mape = float(np.mean(np.abs((y_test_price - ensemble_pred_price) / y_test_price_safe)) * 100)

        self.dataset = df
        self.ensemble_weights = {
            "rf": float(round(rf_weight, 4)),
            "lr": float(round(lr_weight, 4)),
        }
        self.metrics = {
            "mse": mse,
            "rmse": rmse,
            "mae": mae,
            "mape": mape,
            "rf_rmse": rf_rmse,
            "lr_rmse": lr_rmse,
            "train_size": int(len(train_df)),
            "test_size": int(len(test_df)),
        }

        return True

    def _get_fundamentals(self):
        if self.fundamentals is not None:
            return self.fundamentals

        fundamentals = YFinanceHelper.get_fundamentals(self.ticker) or {}
        self.fundamentals = fundamentals
        return fundamentals

    def _predict_fundamental_return(self, current_price):
        fundamentals = self._get_fundamentals()

        eps = self._safe_float(fundamentals.get("eps"))
        roe = self._safe_float(fundamentals.get("roe"))
        pbv = self._safe_float(fundamentals.get("pbv"))
        pe = self._safe_float(fundamentals.get("pe"))

        score = 0.0

        if eps > 0:
            score += 1.0
        elif eps < 0:
            score -= 1.0

        if roe >= 15:
            score += 1.5
        elif roe >= 8:
            score += 0.5
        elif roe < 0:
            score -= 1.0

        if 0 < pbv < 1:
            score += 1.0
        elif 1 <= pbv <= 3:
            score += 0.3
        elif pbv > 5:
            score -= 0.8

        if 0 < pe < 12:
            score += 1.0
        elif 12 <= pe <= 20:
            score += 0.4
        elif pe > 30:
            score -= 1.0
        elif pe <= 0:
            score -= 0.5

        estimated_return_pct = max(min(score * 5.0, 15.0), -15.0)

        direction = "Naik" if estimated_return_pct >= 0 else "Turun"

        recommendation = "HOLD"
        if estimated_return_pct >= 5:
            recommendation = "BUY"
        elif estimated_return_pct <= -5:
            recommendation = "SELL"

        implied_price = current_price * (1 + estimated_return_pct / 100.0)

        return {
            "estimated_return_pct_3m": float(round(estimated_return_pct, 2)),
            "direction_3m": direction,
            "recommendation": recommendation,
            "implied_fair_price_3m": float(round(implied_price, 2)),
            "fundamental_inputs": {
                "eps": float(round(eps, 4)),
                "roe": float(round(roe, 4)),
                "pbv": float(round(pbv, 4)),
                "pe": float(round(pe, 4)),
            },
            "explanation": (
                "Return 3 bulan, arah, dan rekomendasi dihitung dari "
                "sinyal fundamental; bukan dari model harga time-series."
            ),
        }

    def predict_next_period(self):
        if self.dataset is None and not self.train_price_model():
            return None

        if not self.latest_completed_close:
            logger.error("Latest completed close tidak tersedia untuk %s", self.ticker)
            return None

        # pakai close trading terakhir yang benar-benar completed
        current_price = float(self.latest_completed_close["close"])

        # ambil fitur terbaru dari dataset training
        latest_features_row = self.dataset.iloc[-1]
        X_latest = latest_features_row[self.price_feature_columns].to_frame().T.values
        X_latest_scaled = self.scaler.transform(X_latest)

        rf_pred_return = float(self.rf_model.predict(X_latest_scaled)[0])
        lr_pred_return = float(self.lr_model.predict(X_latest_scaled)[0])

        rf_pred_price = current_price * (1 + rf_pred_return)
        lr_pred_price = current_price * (1 + lr_pred_return)

        predicted_close = (
            (rf_pred_price * self.ensemble_weights["rf"]) +
            (lr_pred_price * self.ensemble_weights["lr"])
        )

        price_change_pct = (
            ((predicted_close - current_price) / current_price) * 100
            if current_price else 0.0
        )

        price_recommendation = "HOLD"
        if price_change_pct >= 3:
            price_recommendation = "BUY"
        elif price_change_pct <= -3:
            price_recommendation = "SELL"

        fundamental_view = self._predict_fundamental_return(current_price)

        return {
            "ticker": self.ticker,
            "prediction_horizon_days": self.forecast_horizon,
            "predicted_close_next_day": float(round(predicted_close, 2)),
            "rf_prediction": float(round(rf_pred_price, 2)),
            "lr_prediction": float(round(lr_pred_price, 2)),
            "ensemble_weights": self.ensemble_weights,
            "current_price": float(round(current_price, 2)),
            "current_price_date": self.latest_completed_close["date"],
            "price_expected_change_pct": float(round(price_change_pct, 2)),
            "price_recommendation": price_recommendation,

            "mse": float(round(self.metrics["mse"], 4)),
            "rmse": float(round(self.metrics["rmse"], 4)),
            "mae": float(round(self.metrics["mae"], 4)),
            "mape": float(round(self.metrics["mape"], 4)),
            "rf_rmse": float(round(self.metrics["rf_rmse"], 4)),
            "lr_rmse": float(round(self.metrics["lr_rmse"], 4)),

            "fundamental_prediction": fundamental_view,

            "prediction_date": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S"),
            "features_used": {
                "price_model": {
                    "model": ["Random Forest", "Linear Regression"],
                    "features": self.price_feature_columns,
                    "target": f"return {self.forecast_horizon} trading day ahead",
                },
                "fundamental_model": {
                    "type": "rule-based fundamental scoring",
                    "features": ["EPS", "ROE", "PBV", "PER"],
                    "target": "estimated return 3 months, direction, recommendation",
                },
            },
            "validation": {
                "train_size": self.metrics["train_size"],
                "test_size": self.metrics["test_size"],
                "evaluation_method": "time-series holdout split",
                "price_metric_basis": "predicted return converted back to price",
            }
        }


def predict_stock_price(ticker):
    try:
        predictor = StockPricePredictor(
            ticker=ticker,
            forecast_horizon=1,
            lag_days=10
        )
        if not predictor.train_price_model():
            return None
        return predictor.predict_next_period()
    except Exception as e:
        logger.error("Error in predict_stock_price for %s: %s", ticker, str(e))
        return None