from dataclasses import dataclass

@dataclass(slots=True)
class PriceModelConfig:
    ticker: str
    days: int = 730
    forecast_horizon: int = 1
    lag_days: int = 15
    cutoff_date: str | None = None
    train_ratio: float = 0.8
    sector: str | None = None
    
    @property
    def artifact_name(self) -> str:
        safe_ticker = (self.ticker or '') \
            .upper() \
            .replace('.', '_') \
            .replace('/', '_')

        return f"{safe_ticker}_price_model.pkl"