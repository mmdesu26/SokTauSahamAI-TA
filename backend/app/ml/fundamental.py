# ============================================================
# fundamental.py — rule-based scorer buat analisis fundamental saham
# Ngitung return 3 bulan + arah + rekomendasi BUY/HOLD/SELL
# Metode: skor dihitung dari EPS, ROE, PBV, PER dengan bobot manual
# ============================================================

import logging  # buat log error
from dataclasses import dataclass  # biar bikin "struct" cepet

from app.utils.yfinance_helper import YFinanceHelper  # helper ambil fundamental

logger = logging.getLogger(__name__)  # logger modul ini


@dataclass(slots=True)  # slots=True biar hemat memori
class FundamentalScoreRule:
    # struct aturan scoring — dipake kalau nanti mau di-refactor ke data-driven
    feature: str  # nama fitur (EPS/ROE/PBV/PER)
    label: str  # label interpretasi
    thresholds: tuple  # ambang batas


class FundamentalScorer:
    """Rule-based scoring untuk interpretasi fundamental jangka menengah."""

    def __init__(self, ticker: str):
        self.ticker = ticker  # simpan ticker
        self.fundamentals = None  # cache fundamental (diisi sekali aja)

    @staticmethod
    def _safe_float(value, default=0.0):
        # konversi ke float dengan aman — kalau gagal balik default
        try:
            if value is None:  # null -> default
                return default
            return float(value)  # coba konversi
        except Exception:  # error apapun -> default
            return default

    def get_fundamentals(self):
        # lazy load fundamental — panggil yfinance sekali, cache di self
        if self.fundamentals is None:
            self.fundamentals = YFinanceHelper.get_fundamentals(self.ticker) or {}
        return self.fundamentals

    def score(self, current_price: float):
        # main entry point — hitung skor + rekomendasi
        fundamentals = self.get_fundamentals()  # ambil fundamental

        # ekstrak rasio kunci dengan safe float
        eps = self._safe_float(fundamentals.get("eps"))  # Earning per Share
        roe = self._safe_float(fundamentals.get("roe"))  # Return on Equity (%)
        pbv = self._safe_float(fundamentals.get("pbv"))  # Price to Book Value
        pe = self._safe_float(fundamentals.get("pe"))  # Price to Earning Ratio

        score = 0.0  # skor akumulasi
        rule_hits = []  # log aturan yang kena (buat transparansi)

        # ===== RULE 1: EPS =====
        # EPS positif = perusahaan untung -> bagus
        if eps > 0:
            score += 1.0  # bonus
            rule_hits.append({"feature": "EPS", "reason": "EPS positif", "weight": 1.0})
        elif eps < 0:  # rugi -> jelek
            score -= 1.0
            rule_hits.append({"feature": "EPS", "reason": "EPS negatif", "weight": -1.0})

        # ===== RULE 2: ROE =====
        # ROE >= 15% artinya efisien banget pake modal
        if roe >= 15:
            score += 1.5  # bobot lebih gede (ROE indikator kuat)
            rule_hits.append({"feature": "ROE", "reason": "ROE >= 15%", "weight": 1.5})
        elif roe >= 8:  # lumayan
            score += 0.5
            rule_hits.append({"feature": "ROE", "reason": "8% <= ROE < 15%", "weight": 0.5})
        elif roe < 0:  # rugi terhadap modal
            score -= 1.0
            rule_hits.append({"feature": "ROE", "reason": "ROE negatif", "weight": -1.0})

        # ===== RULE 3: PBV =====
        # PBV < 1 = harga saham di bawah nilai buku (potentially undervalued)
        if 0 < pbv < 1:
            score += 1.0
            rule_hits.append({"feature": "PBV", "reason": "0 < PBV < 1", "weight": 1.0})
        elif 1 <= pbv <= 3:  # normal
            score += 0.3
            rule_hits.append({"feature": "PBV", "reason": "1 <= PBV <= 3", "weight": 0.3})
        elif pbv > 5:  # kemahalan
            score -= 0.8
            rule_hits.append({"feature": "PBV", "reason": "PBV > 5", "weight": -0.8})

        # ===== RULE 4: PER =====
        # PER < 12 = valuasi murah dibanding laba
        if 0 < pe < 12:
            score += 1.0
            rule_hits.append({"feature": "PER", "reason": "0 < PER < 12", "weight": 1.0})
        elif 12 <= pe <= 20:  # wajar
            score += 0.4
            rule_hits.append({"feature": "PER", "reason": "12 <= PER <= 20", "weight": 0.4})
        elif pe > 30:  # terlalu mahal
            score -= 1.0
            rule_hits.append({"feature": "PER", "reason": "PER > 30", "weight": -1.0})
        elif pe <= 0:  # perusahaan rugi
            score -= 0.5
            rule_hits.append({"feature": "PER", "reason": "PER <= 0", "weight": -0.5})

        # konversi skor -> estimasi return % (clamp max +/-15%)
        estimated_return_pct = max(min(score * 5.0, 15.0), -15.0)
        direction = "Naik" if estimated_return_pct >= 0 else "Turun"  # arah tren

        # mapping ke rekomendasi
        recommendation = "HOLD"  # default
        if estimated_return_pct >= 5:  # potensi naik >= 5% -> BUY
            recommendation = "BUY"
        elif estimated_return_pct <= -5:  # potensi turun <= -5% -> SELL
            recommendation = "SELL"

        # harga wajar implisit 3 bulan ke depan
        implied_price = current_price * (1 + estimated_return_pct / 100.0)

        # balikin dict hasil — lengkap supaya transparan
        return {
            "estimated_return_pct_3m": float(round(estimated_return_pct, 2)),  # estimasi %
            "direction_3m": direction,  # Naik / Turun
            "recommendation": recommendation,  # BUY / HOLD / SELL
            "implied_fair_price_3m": float(round(implied_price, 2)),  # harga wajar implied
            "raw_score": float(round(score, 4)),  # skor mentah (buat debug)
            "rule_hits": rule_hits,  # aturan yg kena (transparansi)
            "fundamental_inputs": {  # input yg dipake
                "eps": float(round(eps, 4)),
                "roe": float(round(roe, 4)),
                "pbv": float(round(pbv, 4)),
                "pe": float(round(pe, 4)),
            },
            "explanation": (
                "Return jangka menengah dihitung dari rule-based fundamental scoring. "
                "Bobot saat ini adalah baseline heuristik yang masih bisa dikalibrasi dari data historis."
            ),
        }
