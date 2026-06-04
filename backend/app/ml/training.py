import logging
import pickle
from pathlib import Path

import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
from sklearn.preprocessing import StandardScaler

from .config import PriceModelConfig
from .features import PriceFeatureBuilder

logger = logging.getLogger(__name__)


class PriceModelTrainer:

    def __init__(self, config: PriceModelConfig, historical_df=None):
        self.config = config
        self.feature_builder = PriceFeatureBuilder(config, historical_df=historical_df)
        self.feature_columns = self.feature_builder.build_feature_columns()
        self.scaler = StandardScaler()
        self.rf_model = RandomForestRegressor(
            n_estimators=400,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        )
        self.lr_model = LinearRegression()
        self.dataset = None
        self.latest_completed_close = None
        self.metrics = None
        self.ensemble_weights = {"rf": 0.5, "lr": 0.5}

    def prepare_dataset(self):
        dataset, latest_completed_close = self.feature_builder.prepare_price_dataset()
        self.dataset = dataset
        self.latest_completed_close = latest_completed_close
        return dataset

    def time_series_split(self, df):
        split_idx = int(len(df) * self.config.train_ratio)
        train_df = df.iloc[:split_idx].copy()
        test_df = df.iloc[split_idx:].copy()

        if len(train_df) < 60 or len(test_df) < 20:
            logger.error("Ukuran train/test tidak memadai untuk %s", self.config.ticker)
            return None, None

        return train_df, test_df

    @staticmethod
    def calculate_mape(actual_prices, predicted_prices):
        actual_arr = np.asarray(actual_prices, dtype=float)
        pred_arr = np.asarray(predicted_prices, dtype=float)
        actual_safe = np.where(np.abs(actual_arr) < 1e-8, 1e-8, actual_arr)
        return float(np.mean(np.abs((actual_arr - pred_arr) / actual_safe)) * 100)

    @staticmethod
    def calculate_rmse(actual_prices, predicted_prices):
        actual_arr = np.asarray(actual_prices, dtype=float)
        pred_arr = np.asarray(predicted_prices, dtype=float)
        return float(np.sqrt(np.mean((actual_arr - pred_arr) ** 2)))

    @staticmethod
    def calculate_directional_accuracy(actual_returns, predicted_returns):
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
        return np.asarray(current_close, dtype=float)

    def _fit_models_for_split(self, train_df, test_df):
        X_train = train_df[self.feature_columns].values
        y_train = train_df["target_return_future"].values
        X_test = test_df[self.feature_columns].values
        y_test_return = test_df["target_return_future"].values

        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        rf_model = RandomForestRegressor(
            n_estimators=400,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        )
        lr_model = LinearRegression()

        rf_model.fit(X_train_scaled, y_train)
        lr_model.fit(X_train_scaled, y_train)

        rf_pred_return = rf_model.predict(X_test_scaled)
        lr_pred_return = lr_model.predict(X_test_scaled)

        current_close_test = test_df["close"].values

        actual_price = current_close_test * (1 + y_test_return)
        rf_pred_price = current_close_test * (1 + rf_pred_return)
        lr_pred_price = current_close_test * (1 + lr_pred_return)

        rf_rmse_internal = float(np.sqrt(mean_squared_error(actual_price, rf_pred_price)))
        lr_rmse_internal = float(np.sqrt(mean_squared_error(actual_price, lr_pred_price)))

        eps = 1e-8
        inv_rf = 1.0 / max(rf_rmse_internal, eps)
        inv_lr = 1.0 / max(lr_rmse_internal, eps)
        weight_sum = inv_rf + inv_lr
        rf_weight = inv_rf / weight_sum
        lr_weight = inv_lr / weight_sum

        ensemble_pred_return = (rf_pred_return * rf_weight) + (lr_pred_return * lr_weight)
        ensemble_pred_price = (rf_pred_price * rf_weight) + (lr_pred_price * lr_weight)

        baseline_pred_price = self.baseline_price_from_current_close(current_close_test)
        baseline_pred_return = np.zeros_like(y_test_return)

        return {
            "scaler": scaler,
            "rf_model": rf_model,
            "lr_model": lr_model,
            "rf_weight": float(rf_weight),
            "lr_weight": float(lr_weight),
            "actual_price": actual_price,
            "actual_return": y_test_return,
            "current_close": current_close_test,
            "rf_pred_price": rf_pred_price,
            "lr_pred_price": lr_pred_price,
            "ensemble_pred_price": ensemble_pred_price,
            "ensemble_pred_return": ensemble_pred_return,
            "baseline_pred_price": baseline_pred_price,
            "baseline_pred_return": baseline_pred_return,
            "rf_rmse_internal": rf_rmse_internal,
            "lr_rmse_internal": lr_rmse_internal,
        }

    def evaluate_walk_forward(self, df, max_windows=6):
        train_df, test_df = self.time_series_split(df)
        if train_df is None or test_df is None:
            return None

        split_idx = len(train_df)
        remaining = len(df) - split_idx

        if remaining < 5:
            return None

        candidate_offsets = np.linspace(0, remaining - 1, num=min(max_windows, remaining), dtype=int)
        candidate_offsets = sorted(set(int(x) for x in candidate_offsets))

        results = []
        min_train_size = max(60, len(self.feature_columns) + 5)

        for offset in candidate_offsets:
            pivot = split_idx + offset
            if pivot >= len(df):
                continue

            expanding_train = df.iloc[:pivot].copy()
            one_step_test = df.iloc[pivot:pivot + 1].copy()

            if len(expanding_train) < min_train_size or one_step_test.empty:
                continue

            fold = self._fit_models_for_split(expanding_train, one_step_test)

            actual_price = float(fold["actual_price"][0])
            predicted_price = float(fold["ensemble_pred_price"][0])
            actual_return = float(fold["actual_return"][0])
            predicted_return = float(fold["ensemble_pred_return"][0])
            baseline_price = float(fold["baseline_pred_price"][0])
            baseline_return = float(fold["baseline_pred_return"][0])

            results.append({
                "date": str(one_step_test.index[0].date()),
                "train_size": int(len(expanding_train)),
                "actual_price": actual_price,
                "predicted_price": predicted_price,
                "baseline_price": baseline_price,
                "rmse": self.calculate_rmse([actual_price], [predicted_price]),
                "baseline_rmse": self.calculate_rmse([actual_price], [baseline_price]),
                "direction_correct": int(np.sign(actual_return) == np.sign(predicted_return)),
                "baseline_direction_correct": int(np.sign(actual_return) == np.sign(baseline_return)),
            })

        if not results:
            return None

        return {
            "method": "walk-forward expanding window",
            "windows_evaluated": len(results),
            "window_results": results,
            "avg_rmse": float(round(np.mean([r["rmse"] for r in results]), 2)),
            "avg_baseline_rmse": float(round(np.mean([r["baseline_rmse"] for r in results]), 2)),
            "directional_accuracy": float(round(np.mean([r["direction_correct"] for r in results]) * 100, 2)),
            "baseline_directional_accuracy": float(round(np.mean([r["baseline_direction_correct"] for r in results]) * 100, 2)),
        }

    def fit(self):
        df = self.prepare_dataset()
        if df is None or df.empty:
            return False

        train_df, test_df = self.time_series_split(df)
        if train_df is None or test_df is None:
            return False

        split_eval = self._fit_models_for_split(train_df, test_df)

        self.scaler = split_eval["scaler"]
        self.rf_model = split_eval["rf_model"]
        self.lr_model = split_eval["lr_model"]

        actual_price = split_eval["actual_price"]
        actual_return = split_eval["actual_return"]
        ensemble_pred_price = split_eval["ensemble_pred_price"]
        ensemble_pred_return = split_eval["ensemble_pred_return"]
        baseline_pred_price = split_eval["baseline_pred_price"]
        baseline_pred_return = split_eval["baseline_pred_return"]

        mape = self.calculate_mape(actual_price, ensemble_pred_price)
        rmse = self.calculate_rmse(actual_price, ensemble_pred_price)
        baseline_rmse = self.calculate_rmse(actual_price, baseline_pred_price)
        directional_accuracy = self.calculate_directional_accuracy(actual_return, ensemble_pred_return)
        baseline_directional_accuracy = self.calculate_directional_accuracy(actual_return, baseline_pred_return)

        model_beats_baseline = bool(rmse < baseline_rmse)

        self.ensemble_weights = {
            "rf": float(round(split_eval["rf_weight"], 4)),
            "lr": float(round(split_eval["lr_weight"], 4)),
        }

        walk_forward = self.evaluate_walk_forward(df)

        self.metrics = {
            "rmse": float(round(rmse, 2)),
            "baseline_rmse": float(round(baseline_rmse, 2)),
            "directional_accuracy": float(round(directional_accuracy, 2)),
            "baseline_directional_accuracy": float(round(baseline_directional_accuracy, 2)),
            "model_beats_baseline": model_beats_baseline,
            "train_size": int(len(train_df)),
            "test_size": int(len(test_df)),
            "rf_rmse_internal": float(round(split_eval["rf_rmse_internal"], 2)),
            "lr_rmse_internal": float(round(split_eval["lr_rmse_internal"], 2)),
            "evaluation_method": "time-series holdout split + walk-forward backtesting",
            "price_metric_basis": "predicted return converted back to price",
            "accuracy_metric": "RMSE",
            "baseline_method": "next close equals current close",
            "walk_forward": walk_forward,
        }

        return True

    def build_artifact(self):
        if self.dataset is None or self.metrics is None:
            raise ValueError("Model belum dilatih. Jalankan fit() terlebih dahulu.")

        return {
            "config": {
                "ticker": self.config.ticker,
                "days": self.config.days,
                "forecast_horizon": self.config.forecast_horizon,
                "lag_days": self.config.lag_days,
                "train_ratio": self.config.train_ratio,
            },
            "feature_columns": self.feature_columns,
            "rf_model": self.rf_model,
            "lr_model": self.lr_model,
            "scaler": self.scaler,
            "ensemble_weights": self.ensemble_weights,
            "metrics": self.metrics,
            "latest_completed_close": self.latest_completed_close,
        }

    def save_artifact(self, directory: str | Path):
        directory = Path(directory)
        directory.mkdir(parents=True, exist_ok=True)
        path = directory / self.config.artifact_name
        artifact = self.build_artifact()

        with path.open("wb") as fh:
            pickle.dump(artifact, fh)

        return path