import logging
from dataclasses import dataclass
from typing import Optional

from app.utils.yfinance_helper import YFinanceHelper

logger = logging.getLogger(__name__)

ROE_HIGH_THRESHOLD    = 15.0
ROE_MID_THRESHOLD     = 8.0
PER_VALUE_THRESHOLD   = 15.0
PER_GROWTH_THRESHOLD  = 25.0
PER_PREMIUM_THRESHOLD = 35.0
PBV_UNDERVALUE        = 1.0
PBV_NORMAL_MAX        = 3.0
PBV_OVERVALUE         = 5.0

WEIGHT_EPS  = 1.0
WEIGHT_ROE  = 1.5
WEIGHT_PBV  = 1.0
WEIGHT_PER  = 1.0

SCORE_TO_RETURN_MULTIPLIER = 3.5
RETURN_CAP_PCT = 15.0

BUY_THRESHOLD  = 5.0
SELL_THRESHOLD = -5.0


@dataclass
class BenchmarkData:
    eps_median:  Optional[float] = None
    roe_median:  Optional[float] = None
    pbv_median:  Optional[float] = None
    per_median:  Optional[float] = None
    eps_iqr:     Optional[float] = None
    roe_iqr:     Optional[float] = None
    pbv_iqr:     Optional[float] = None
    per_iqr:     Optional[float] = None
    sector:      str = ""
    sample_size: int = 0


class SectorBenchmarkCalculator:

    @staticmethod
    def _median(values: list) -> Optional[float]:
        if not values:
            return None
        s = sorted(values)
        n = len(s)
        mid = n // 2
        return s[mid] if n % 2 == 1 else (s[mid - 1] + s[mid]) / 2.0

    @staticmethod
    def _iqr(values: list) -> Optional[float]:
        if len(values) < 4:
            return None
        s = sorted(values)
        n = len(s)
        q1_idx = n // 4
        q3_idx = (3 * n) // 4
        return s[q3_idx] - s[q1_idx]

    @classmethod
    def compute_from_db(cls, sector: str, exclude_ticker: Optional[str] = None) -> BenchmarkData:
        benchmark = BenchmarkData(sector=sector)
        try:
            from app.models import StockFundamental, Stock
            from app import db

            query = (
                db.session.query(StockFundamental)
                .join(Stock, Stock.id == StockFundamental.stock_id)
                .filter(Stock.sector == sector)
            )
            if exclude_ticker:
                query = query.filter(Stock.ticker != exclude_ticker.upper().replace(".JK", ""))

            records = query.all()
            benchmark.sample_size = len(records)

            if benchmark.sample_size < 2:
                logger.warning(
                    f"[Benchmark] Sektor '{sector}' hanya punya {benchmark.sample_size} saham. "
                    "Fallback ke threshold absolut."
                )
                return benchmark

            eps_vals = [r.eps_ttm for r in records if r.eps_ttm is not None]
            roe_vals = [r.roe     for r in records if r.roe     is not None]
            pbv_vals = [r.pbv     for r in records if r.pbv     is not None and r.pbv > 0]
            per_vals = [r.per_ttm for r in records if r.per_ttm is not None and r.per_ttm > 0]

            benchmark.eps_median = cls._median(eps_vals)
            benchmark.roe_median = cls._median(roe_vals)
            benchmark.pbv_median = cls._median(pbv_vals)
            benchmark.per_median = cls._median(per_vals)
            benchmark.eps_iqr    = cls._iqr(eps_vals)
            benchmark.roe_iqr    = cls._iqr(roe_vals)
            benchmark.pbv_iqr    = cls._iqr(pbv_vals)
            benchmark.per_iqr    = cls._iqr(per_vals)

            logger.info(
                f"[Benchmark] Sektor '{sector}' n={benchmark.sample_size} | "
                f"EPS={benchmark.eps_median} ROE={benchmark.roe_median}% "
                f"PBV={benchmark.pbv_median} PER={benchmark.per_median}"
            )
        except Exception as e:
            logger.error(f"[Benchmark] Gagal hitung benchmark sektor '{sector}': {e}")

        return benchmark


class FundamentalScorer:

    def __init__(self, ticker: str):
        self.ticker = ticker.upper().replace(".JK", "")
        self._fundamentals: Optional[dict] = None

    @staticmethod
    def _safe_float(value, default: float = 0.0) -> float:
        try:
            return default if value is None else float(value)
        except Exception:
            return default

    def get_fundamentals(self) -> dict:
        if self._fundamentals is None:
            self._fundamentals = YFinanceHelper.get_fundamentals(self.ticker) or {}
        return self._fundamentals

    @staticmethod
    def _robust_z(value: float, median: float, iqr: Optional[float]) -> float:
        if iqr is None or iqr <= 0:
            if value > median:
                return 0.5
            elif value < median:
                return -0.5
            return 0.0
        sigma_est = iqr / 1.35
        z = (value - median) / sigma_est
        return max(-2.0, min(2.0, z))

    def _score_relative(self, eps, roe, pbv, pe, bm: BenchmarkData):
        score = 0.0
        rule_hits = []

        if bm.eps_median is not None:
            z = self._robust_z(eps, bm.eps_median, bm.eps_iqr)
            contrib = WEIGHT_EPS * (z / 2.0)
            score += contrib
            if eps > 0 and z > 0:
                reason = f"EPS di atas median sektor ({bm.eps_median:.2f})"
            elif eps < 0:
                reason = "EPS negatif"
            elif z < 0:
                reason = f"EPS di bawah median sektor ({bm.eps_median:.2f})"
            else:
                reason = "EPS setara median sektor"
            rule_hits.append({"feature": "EPS", "reason": reason, "weight": round(contrib, 3),
                               "z_score": round(z, 2), "sector_median": bm.eps_median})

        if bm.roe_median is not None:
            z = self._robust_z(roe, bm.roe_median, bm.roe_iqr)
            contrib = WEIGHT_ROE * (z / 2.0)
            score += contrib
            if roe >= ROE_HIGH_THRESHOLD and z > 0:
                reason = f"ROE >= {ROE_HIGH_THRESHOLD}% dan di atas median sektor ({bm.roe_median:.1f}%)"
            elif roe >= ROE_MID_THRESHOLD:
                reason = f"ROE moderat ({roe:.1f}%) vs median sektor ({bm.roe_median:.1f}%)"
            elif roe < 0:
                reason = "ROE negatif"
            else:
                reason = f"ROE di bawah median sektor ({bm.roe_median:.1f}%)"
            rule_hits.append({"feature": "ROE", "reason": reason, "weight": round(contrib, 3),
                               "z_score": round(z, 2), "sector_median": bm.roe_median})

        if bm.pbv_median is not None and pbv > 0:
            z = -self._robust_z(pbv, bm.pbv_median, bm.pbv_iqr)
            contrib = WEIGHT_PBV * (z / 2.0)
            score += contrib
            if z > 0:
                reason = f"PBV di bawah median sektor ({bm.pbv_median:.2f}) — relatif murah"
            elif z < 0:
                reason = f"PBV di atas median sektor ({bm.pbv_median:.2f}) — relatif mahal"
            else:
                reason = "PBV setara median sektor"
            rule_hits.append({"feature": "PBV", "reason": reason, "weight": round(contrib, 3),
                               "z_score": round(z, 2), "sector_median": bm.pbv_median})

        if bm.per_median is not None and pe > 0:
            z = -self._robust_z(pe, bm.per_median, bm.per_iqr)
            contrib = WEIGHT_PER * (z / 2.0)
            score += contrib
            if z > 0:
                reason = f"PER di bawah median sektor ({bm.per_median:.1f}) — valuasi murah"
            elif z < 0:
                reason = f"PER di atas median sektor ({bm.per_median:.1f}) — valuasi mahal"
            else:
                reason = "PER setara median sektor"
            rule_hits.append({"feature": "PER", "reason": reason, "weight": round(contrib, 3),
                               "z_score": round(z, 2), "sector_median": bm.per_median})

        return score, rule_hits

    def _score_absolute(self, eps, roe, pbv, pe):
        score = 0.0
        rule_hits = []

        if eps > 0:
            score += WEIGHT_EPS * 0.5
            rule_hits.append({"feature": "EPS", "reason": "EPS positif", "weight": WEIGHT_EPS * 0.5})
        elif eps < 0:
            score -= WEIGHT_EPS * 0.5
            rule_hits.append({"feature": "EPS", "reason": "EPS negatif", "weight": -WEIGHT_EPS * 0.5})

        if roe >= ROE_HIGH_THRESHOLD:
            score += WEIGHT_ROE * 0.67
            rule_hits.append({"feature": "ROE", "reason": f"ROE >= {ROE_HIGH_THRESHOLD}%", "weight": WEIGHT_ROE * 0.67})
        elif roe >= ROE_MID_THRESHOLD:
            score += WEIGHT_ROE * 0.2
            rule_hits.append({"feature": "ROE", "reason": f"ROE {roe:.1f}% (moderat)", "weight": WEIGHT_ROE * 0.2})
        elif roe < 0:
            score -= WEIGHT_ROE * 0.5
            rule_hits.append({"feature": "ROE", "reason": "ROE negatif", "weight": -WEIGHT_ROE * 0.5})

        if 0 < pbv < PBV_UNDERVALUE:
            score += WEIGHT_PBV * 0.75
            rule_hits.append({"feature": "PBV", "reason": "PBV < 1 (undervalued)", "weight": WEIGHT_PBV * 0.75})
        elif PBV_UNDERVALUE <= pbv <= PBV_NORMAL_MAX:
            score += WEIGHT_PBV * 0.15
            rule_hits.append({"feature": "PBV", "reason": f"PBV {pbv:.2f} (wajar 1-3x)", "weight": WEIGHT_PBV * 0.15})
        elif pbv > PBV_OVERVALUE:
            score -= WEIGHT_PBV * 0.5
            rule_hits.append({"feature": "PBV", "reason": f"PBV > {PBV_OVERVALUE} (overvalued)", "weight": -WEIGHT_PBV * 0.5})

        if 0 < pe <= PER_VALUE_THRESHOLD:
            score += WEIGHT_PER * 0.75
            rule_hits.append({"feature": "PER", "reason": f"PER <= {PER_VALUE_THRESHOLD} (murah)", "weight": WEIGHT_PER * 0.75})
        elif PER_VALUE_THRESHOLD < pe <= PER_GROWTH_THRESHOLD:
            score += WEIGHT_PER * 0.2
            rule_hits.append({"feature": "PER", "reason": f"PER {pe:.1f} (wajar growth)", "weight": WEIGHT_PER * 0.2})
        elif pe > PER_PREMIUM_THRESHOLD:
            score -= WEIGHT_PER * 0.6
            rule_hits.append({"feature": "PER", "reason": f"PER > {PER_PREMIUM_THRESHOLD} (premium)", "weight": -WEIGHT_PER * 0.6})
        elif pe <= 0:
            score -= WEIGHT_PER * 0.4
            rule_hits.append({"feature": "PER", "reason": "PER negatif (rugi)", "weight": -WEIGHT_PER * 0.4})

        return score, rule_hits

    def score(self, current_price: float, sector: Optional[str] = None) -> dict:
        fundamentals = self.get_fundamentals()

        eps = self._safe_float(fundamentals.get("eps"))
        roe = self._safe_float(fundamentals.get("roe"))
        pbv = self._safe_float(fundamentals.get("pbv"))
        pe  = self._safe_float(fundamentals.get("pe"))

        if not sector:
            try:
                info = YFinanceHelper.get_stock_info(self.ticker)
                sector = info.get("sector", "") or ""
            except Exception:
                sector = ""

        benchmark = BenchmarkData()
        if sector:
            benchmark = SectorBenchmarkCalculator.compute_from_db(
                sector=sector,
                exclude_ticker=self.ticker,
            )

        has_benchmark = benchmark.sample_size >= 2 and any(
            v is not None for v in [
                benchmark.eps_median, benchmark.roe_median,
                benchmark.pbv_median, benchmark.per_median,
            ]
        )

        if has_benchmark:
            score, rule_hits = self._score_relative(eps, roe, pbv, pe, benchmark)
            scoring_mode = "relative_sector"
        else:
            score, rule_hits = self._score_absolute(eps, roe, pbv, pe)
            scoring_mode = "absolute_fallback"

        raw_return = score * SCORE_TO_RETURN_MULTIPLIER
        estimated_return_pct = max(min(raw_return, RETURN_CAP_PCT), -RETURN_CAP_PCT)
        direction = "Naik" if estimated_return_pct >= 0 else "Turun"

        if estimated_return_pct >= BUY_THRESHOLD:
            recommendation = "BUY"
        elif estimated_return_pct <= SELL_THRESHOLD:
            recommendation = "SELL"
        else:
            recommendation = "HOLD"

        implied_price = current_price * (1 + estimated_return_pct / 100.0)

        benchmark_output = {
            "sector":      sector or "N/A",
            "sample_size": benchmark.sample_size,
            "eps_median":  round(benchmark.eps_median, 4) if benchmark.eps_median is not None else None,
            "roe_median":  round(benchmark.roe_median, 2) if benchmark.roe_median is not None else None,
            "pbv_median":  round(benchmark.pbv_median, 3) if benchmark.pbv_median is not None else None,
            "per_median":  round(benchmark.per_median, 2) if benchmark.per_median is not None else None,
        }

        return {
            "estimated_return_pct_3m": float(round(estimated_return_pct, 2)),
            "direction_3m":            direction,
            "recommendation":          recommendation,
            "implied_fair_price_3m":   float(round(implied_price, 2)),
            "raw_score":               float(round(score, 4)),
            "scoring_mode":            scoring_mode,
            "rule_hits":               rule_hits,
            "fundamental_inputs": {
                "eps": float(round(eps, 4)),
                "roe": float(round(roe, 4)),
                "pbv": float(round(pbv, 4)),
                "pe":  float(round(pe,  4)),
            },
            "sector_benchmark": benchmark_output,
        }