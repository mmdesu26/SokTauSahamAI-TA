import logging
import pickle
from pathlib import Path

import pandas as pd

from .config import PriceModelConfig
from .features import PriceFeatureBuilder
from .fundamental import FundamentalScorer
from .training import PriceModelTrainer

logger = logging.getLogger(__name__)

ARTIFACTS_DIR = Path(__file__).resolve().parent / "models"


class StockPredictionService:
    def __init__(self, config: PriceModelConfig, historical_df=None):
        self.config = config
        self.historical_df = historical_df
        self.trainer = None
        self.artifact = None
        self.dataset = None
        self.latest_completed_close = None

    def _artifact_path(self):
        return ARTIFACTS_DIR / self.config.artifact_name

    def load_artifact(self):
        path = self._artifact_path()

        if not path.exists():
            return None

        with path.open("rb") as fh:
            return pickle.load(fh)

    def train_runtime_model(self):
        trainer = PriceModelTrainer(self.config, historical_df=self.historical_df)

        if not trainer.fit():
            return None

        self.trainer = trainer
        self.artifact = trainer.build_artifact()
        self.dataset = trainer.dataset
        self.latest_completed_close = trainer.latest_completed_close

        return self.artifact

    def ensure_runtime_artifact(self):
        if self.artifact is not None:
            return self.artifact

        if self.historical_df is not None or self.config.cutoff_date:
            return self.train_runtime_model()

        artifact = self.load_artifact()

        if artifact:
            self.artifact = artifact
            return artifact

        return self.train_runtime_model()

    def _prepare_prediction_dataset(self):
        feature_builder = PriceFeatureBuilder(self.config, historical_df=self.historical_df)

        if hasattr(feature_builder, "prepare_prediction_dataset"):
            return feature_builder.prepare_prediction_dataset()

        return feature_builder.prepare_price_dataset()

    def predict(self):
        artifact = self.ensure_runtime_artifact()

        if not artifact:
            return None

        dataset, latest_completed_close = self._prepare_prediction_dataset()

        if dataset is None or dataset.empty:
            return None

        if not latest_completed_close:
            latest_completed_close = self.latest_completed_close or artifact.get("latest_completed_close")

        if not latest_completed_close:
            logger.error("Latest completed close tidak tersedia untuk %s", self.config.ticker)
            return None

        feature_columns = artifact["feature_columns"]
        latest_features_row = dataset.iloc[-1]
        X_latest = latest_features_row[feature_columns].to_frame().T.values
        X_latest_scaled = artifact["scaler"].transform(X_latest)

        current_price = float(latest_completed_close["close"])

        rf_pred_return = float(artifact["rf_model"].predict(X_latest_scaled)[0])
        lr_pred_return = float(artifact["lr_model"].predict(X_latest_scaled)[0])

        rf_pred_price = current_price * (1 + rf_pred_return)
        lr_pred_price = current_price * (1 + lr_pred_return)

        ensemble_weights = artifact["ensemble_weights"]

        predicted_close = (
            rf_pred_price * ensemble_weights["rf"]
            + lr_pred_price * ensemble_weights["lr"]
        )

        if current_price:
            price_change_pct = ((predicted_close - current_price) / current_price) * 100
        else:
            price_change_pct = 0.0

        price_recommendation = "HOLD"

        if price_change_pct >= 3:
            price_recommendation = "BUY"
        elif price_change_pct <= -3:
            price_recommendation = "SELL"

        try:
            fundamental_view = FundamentalScorer(self.config.ticker).score(
                current_price,
                sector=getattr(self.config, "sector", None)
            )
        except Exception as exc:
            logger.warning("Fundamental scorer dilewati untuk %s: %s", self.config.ticker, exc)
            fundamental_view = None

        metrics = artifact.get("metrics", {})

        return {
            "ticker": self.config.ticker,
            "prediction_horizon_days": self.config.forecast_horizon,
            "predicted_close_next_day": float(round(predicted_close, 2)),
            "rf_prediction": float(round(rf_pred_price, 2)),
            "lr_prediction": float(round(lr_pred_price, 2)),
            "ensemble_weights": ensemble_weights,
            "current_price": float(round(current_price, 2)),
            "current_price_date": latest_completed_close["date"],
            "price_expected_change_pct": float(round(price_change_pct, 2)),
            "price_recommendation": price_recommendation,
            "rmse": float(round(metrics.get("rmse", 0), 2)),
            "fundamental_prediction": fundamental_view,
            "prediction_date": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S"),
            "features_used": {
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
            "validation": {
                "train_size": metrics.get("train_size"),
                "test_size": metrics.get("test_size"),
                "evaluation_method": metrics.get("evaluation_method"),
                "price_metric_basis": metrics.get("price_metric_basis"),
                "accuracy_metric": metrics.get("accuracy_metric"),
                "rmse": metrics.get("rmse"),
                "baseline_rmse": metrics.get("baseline_rmse"),
                "directional_accuracy": metrics.get("directional_accuracy"),
                "baseline_directional_accuracy": metrics.get("baseline_directional_accuracy"),
                "baseline_method": metrics.get("baseline_method"),
                "model_beats_baseline": metrics.get("model_beats_baseline"),
                "walk_forward": metrics.get("walk_forward"),
            },
        }


def predict_stock_price(
    ticker,
    days=730,
    forecast_horizon=1,
    lag_days=15,
    cutoff_date=None,
    historical_df=None,
    sector=None
):
    try:
        config = PriceModelConfig(
            ticker=ticker,
            days=days,
            forecast_horizon=forecast_horizon,
            lag_days=lag_days,
            cutoff_date=cutoff_date,
            sector=sector,
        )

        service = StockPredictionService(config, historical_df=historical_df)

        return service.predict()

    except Exception as exc:
        logger.error("Error in predict_stock_price for %s: %s", ticker, str(exc))
        return None