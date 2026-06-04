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
        artifact = self.load_artifact()
        if artifact:
            self.artifact = artifact
            return artifact
        artifact = self.train_runtime_model()
        return artifact

    def predict(self):
        artifact = self.ensure_runtime_artifact()
        if not artifact:
            return None

        current_price_meta = self.latest_completed_close or artifact.get("latest_completed_close")
        if not current_price_meta:
            logger.error("Latest completed close tidak tersedia untuk %s", self.config.ticker)
            return None

        feature_builder = PriceFeatureBuilder(self.config, historical_df=self.historical_df)
        dataset, latest_completed_close = feature_builder.prepare_price_dataset()
        if dataset is None or dataset.empty:
            return None

        latest_features_row = dataset.iloc[-1]
        feature_columns = artifact["feature_columns"]
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

        price_change_pct = ((predicted_close - current_price) / current_price) * 100 if current_price else 0.0
        price_recommendation = "HOLD"
        if price_change_pct >= 3:
            price_recommendation = "BUY"
        elif price_change_pct <= -3:
            price_recommendation = "SELL"

        fundamental_view = FundamentalScorer(self.config.ticker).score(
            current_price, sector=getattr(self.config, "sector", None)
        )

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
            "rmse": float(round(artifact["metrics"]["rmse"], 2)),
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
                "train_size": artifact["metrics"]["train_size"],
                "test_size": artifact["metrics"]["test_size"],
                "evaluation_method": artifact["metrics"]["evaluation_method"],
                "price_metric_basis": artifact["metrics"]["price_metric_basis"],
                "accuracy_metric": artifact["metrics"]["accuracy_metric"],
                "rmse": artifact["metrics"].get("rmse"),
                "baseline_rmse": artifact["metrics"].get("baseline_rmse"),
                "directional_accuracy": artifact["metrics"].get("directional_accuracy"),
                "baseline_directional_accuracy": artifact["metrics"].get("baseline_directional_accuracy"),
                "baseline_method": artifact["metrics"].get("baseline_method"),
                "model_beats_baseline": artifact["metrics"].get("model_beats_baseline"),
                "walk_forward": artifact["metrics"].get("walk_forward"),
            },
        }


def predict_stock_price(ticker, days=730, forecast_horizon=1, lag_days=15, cutoff_date=None, historical_df=None, sector=None):
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