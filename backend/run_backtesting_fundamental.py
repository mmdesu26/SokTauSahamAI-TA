"""
run_backtesting_fundamental.py

Backtesting untuk analisis fundamental saham pada horizon jangka menengah.

Cara kerja:
  1. Ambil data fundamental saham pada tanggal dasar (base_date).
  2. Hitung skor fundamental dan rekomendasi (BUY/HOLD/SELL) serta
     estimasi return berdasarkan scoring.
  3. Maju ke depan sesuai horizon (3, 5, atau 6 bulan).
  4. Ambil harga aktual saham di akhir horizon.
  5. Bandingkan: apakah arah estimasi (Naik/Turun) sesuai dengan
     pergerakan harga aktual? Apakah magnitude estimasi return mendekati
     return aktual?

Contoh pemakaian:
  python run_backtesting_fundamental.py --ticker BBCA --base-date 2024-01-02
  python run_backtesting_fundamental.py --ticker BBCA --base-date 2024-01-02 --horizon 6
  python run_backtesting_fundamental.py --ticker BBCA --base-date 2024-01-02 --runs 5
  python run_backtesting_fundamental.py --ticker BBCA --base-date 2024-01-02 --horizon 5 --runs 4
"""

import argparse
import json
import sys
from datetime import date, timedelta

import pandas as pd
import yfinance as yf

from app.utils.yfinance_helper import YFinanceHelper
from app.ml.fundamental import (
    BUY_THRESHOLD,
    SELL_THRESHOLD,
    SCORE_TO_RETURN_MULTIPLIER,
    RETURN_CAP_PCT,
    ROE_HIGH_THRESHOLD,
    ROE_MID_THRESHOLD,
    PER_VALUE_THRESHOLD,
    PER_GROWTH_THRESHOLD,
    PER_PREMIUM_THRESHOLD,
    PBV_UNDERVALUE,
    PBV_NORMAL_MAX,
    PBV_OVERVALUE,
    WEIGHT_EPS,
    WEIGHT_ROE,
    WEIGHT_PBV,
    WEIGHT_PER,
)

TRADING_DAYS_PER_MONTH = 21


def load_price_history(symbol: str, lookback_days: int = 900) -> pd.DataFrame:
    stock = yf.Ticker(symbol)
    hist = stock.history(period=f"{lookback_days}d", interval="1d", auto_adjust=False)
    if hist is None or hist.empty:
        raise ValueError(f"Data historis harga kosong untuk {symbol}")
    hist = hist.dropna(subset=["Close"]).copy()
    hist = YFinanceHelper._normalize_history_index_to_jakarta(hist)
    if hist.empty:
        raise ValueError(f"Data historis kosong setelah normalisasi untuk {symbol}")
    return hist.sort_index()


def get_price_on_or_before(hist: pd.DataFrame, target_date: date) -> tuple:
    eligible = hist[hist.index.date <= target_date]
    if eligible.empty:
        raise ValueError(f"Tidak ada data harga pada atau sebelum {target_date}")
    row = eligible.iloc[-1]
    return float(row["Close"]), eligible.index[-1].date()


def get_price_on_or_after(hist: pd.DataFrame, target_date: date) -> tuple:
    eligible = hist[hist.index.date >= target_date]
    if eligible.empty:
        raise ValueError(f"Tidak ada data harga pada atau sesudah {target_date}")
    row = eligible.iloc[0]
    return float(row["Close"]), eligible.index[0].date()


def score_without_db(eps, roe, pbv, pe, current_price: float) -> dict:
    """
    Hitung skor fundamental tanpa koneksi DB (mode absolut).
    Dipakai di backtesting karena tidak ada Flask app context.
    """
    score = 0.0
    rule_hits = []

    if eps is not None:
        eps = float(eps)
        if eps > 0:
            score += WEIGHT_EPS * 0.5
            rule_hits.append({"feature": "EPS", "reason": "EPS positif", "weight": WEIGHT_EPS * 0.5})
        elif eps < 0:
            score -= WEIGHT_EPS * 0.5
            rule_hits.append({"feature": "EPS", "reason": "EPS negatif", "weight": -WEIGHT_EPS * 0.5})
    else:
        eps = 0.0

    if roe is not None:
        roe = float(roe)
        if roe >= ROE_HIGH_THRESHOLD:
            score += WEIGHT_ROE * 0.67
            rule_hits.append({"feature": "ROE", "reason": f"ROE >= {ROE_HIGH_THRESHOLD}%", "weight": WEIGHT_ROE * 0.67})
        elif roe >= ROE_MID_THRESHOLD:
            score += WEIGHT_ROE * 0.2
            rule_hits.append({"feature": "ROE", "reason": f"ROE {roe:.1f}% (moderat)", "weight": WEIGHT_ROE * 0.2})
        elif roe < 0:
            score -= WEIGHT_ROE * 0.5
            rule_hits.append({"feature": "ROE", "reason": "ROE negatif", "weight": -WEIGHT_ROE * 0.5})
    else:
        roe = 0.0

    if pbv is not None:
        pbv = float(pbv)
        if 0 < pbv < PBV_UNDERVALUE:
            score += WEIGHT_PBV * 0.75
            rule_hits.append({"feature": "PBV", "reason": "PBV < 1 (undervalued)", "weight": WEIGHT_PBV * 0.75})
        elif PBV_UNDERVALUE <= pbv <= PBV_NORMAL_MAX:
            score += WEIGHT_PBV * 0.15
            rule_hits.append({"feature": "PBV", "reason": f"PBV {pbv:.2f} (wajar)", "weight": WEIGHT_PBV * 0.15})
        elif pbv > PBV_OVERVALUE:
            score -= WEIGHT_PBV * 0.5
            rule_hits.append({"feature": "PBV", "reason": f"PBV > {PBV_OVERVALUE} (mahal)", "weight": -WEIGHT_PBV * 0.5})
    else:
        pbv = 0.0

    if pe is not None:
        pe = float(pe)
        if 0 < pe <= PER_VALUE_THRESHOLD:
            score += WEIGHT_PER * 0.75
            rule_hits.append({"feature": "PER", "reason": f"PER <= {PER_VALUE_THRESHOLD} (murah)", "weight": WEIGHT_PER * 0.75})
        elif PER_VALUE_THRESHOLD < pe <= PER_GROWTH_THRESHOLD:
            score += WEIGHT_PER * 0.2
            rule_hits.append({"feature": "PER", "reason": f"PER {pe:.1f} (wajar)", "weight": WEIGHT_PER * 0.2})
        elif pe > PER_PREMIUM_THRESHOLD:
            score -= WEIGHT_PER * 0.6
            rule_hits.append({"feature": "PER", "reason": f"PER > {PER_PREMIUM_THRESHOLD} (premium)", "weight": -WEIGHT_PER * 0.6})
        elif pe <= 0:
            score -= WEIGHT_PER * 0.4
            rule_hits.append({"feature": "PER", "reason": "PER negatif (rugi)", "weight": -WEIGHT_PER * 0.4})
    else:
        pe = 0.0

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

    return {
        "raw_score": round(score, 4),
        "estimated_return_pct": round(estimated_return_pct, 2),
        "direction": direction,
        "recommendation": recommendation,
        "implied_price": round(implied_price, 2),
        "rule_hits": rule_hits,
        "fundamental_inputs": {
            "eps": round(eps, 4),
            "roe": round(roe, 4),
            "pbv": round(pbv, 4),
            "pe":  round(pe,  4),
        },
    }


def run_single_fundamental_backtest(
    ticker: str,
    base_date_str: str,
    horizon_months: int = 3,
) -> dict:
    """
    Satu skenario backtesting fundamental.

    Args:
        ticker: kode saham (BBCA atau BBCA.JK)
        base_date_str: tanggal awal analisis (YYYY-MM-DD)
        horizon_months: berapa bulan ke depan (3, 5, atau 6)

    Returns:
        dict hasil backtesting
    """
    symbol = YFinanceHelper.normalize_symbol(ticker)
    base_date = pd.Timestamp(base_date_str).date()

    hist = load_price_history(symbol)

    # Harga saham di tanggal dasar
    base_price, actual_base_date = get_price_on_or_before(hist, base_date)

    # Tanggal target = base_date + horizon bulan (kalender)
    target_date = base_date + timedelta(days=30 * horizon_months)

    # Harga saham di tanggal target
    try:
        target_price, actual_target_date = get_price_on_or_after(hist, target_date)
    except ValueError:
        raise ValueError(
            f"Tidak ada data harga sesudah {target_date}. "
            "Coba base_date yang lebih lama."
        )

    # Ambil fundamental saham via yfinance (data saat ini — limitation backtesting)
    raw_fund = YFinanceHelper.get_fundamentals(symbol)
    eps = raw_fund.get("eps")
    roe = raw_fund.get("roe")
    pbv = raw_fund.get("pbv")
    pe  = raw_fund.get("pe")

    # Hitung skor fundamental
    fund_result = score_without_db(eps, roe, pbv, pe, base_price)

    # Return aktual selama horizon
    actual_return_pct = ((target_price - base_price) / base_price) * 100

    # Arah aktual
    actual_direction = "Naik" if target_price >= base_price else "Turun"

    # Apakah arah estimasi benar?
    direction_correct = fund_result["direction"] == actual_direction

    # Selisih estimasi vs aktual
    return_error = abs(fund_result["estimated_return_pct"] - actual_return_pct)

    # Klasifikasi keakuratan arah
    if direction_correct:
        direction_accuracy_label = "Arah benar"
    else:
        direction_accuracy_label = "Arah salah"

    # Klasifikasi selisih return
    if return_error <= 3:
        return_accuracy_label = "Estimasi return sangat dekat (<=3%)"
    elif return_error <= 8:
        return_accuracy_label = "Estimasi return cukup dekat (<=8%)"
    else:
        return_accuracy_label = "Estimasi return jauh (>8%)"

    return {
        "ticker": symbol,
        "horizon_months": horizon_months,
        "base_date_requested": base_date_str,
        "actual_base_date": str(actual_base_date),
        "actual_target_date": str(actual_target_date),
        "base_price": round(base_price, 2),
        "target_price": round(target_price, 2),
        "actual_return_pct": round(actual_return_pct, 2),
        "actual_direction": actual_direction,
        "estimated_return_pct": fund_result["estimated_return_pct"],
        "estimated_direction": fund_result["direction"],
        "recommendation": fund_result["recommendation"],
        "implied_price": fund_result["implied_price"],
        "direction_correct": direction_correct,
        "direction_accuracy_label": direction_accuracy_label,
        "return_error_pct": round(return_error, 2),
        "return_accuracy_label": return_accuracy_label,
        "raw_score": fund_result["raw_score"],
        "rule_hits": fund_result["rule_hits"],
        "fundamental_inputs": fund_result["fundamental_inputs"],
        "notes": {
            "limitation": (
                "Data fundamental yang digunakan adalah data terkini dari yfinance, "
                "bukan data historis pada tanggal dasar. Ini adalah keterbatasan umum "
                "backtesting fundamental berbasis API publik."
            ),
            "direction_logic": (
                f"Estimasi Naik jika return >= 0, Turun jika < 0. "
                f"BUY jika return >= {BUY_THRESHOLD}%, SELL jika <= {SELL_THRESHOLD}%."
            ),
        },
    }


def run_multi_fundamental_backtest(
    ticker: str,
    end_base_date_str: str,
    horizon_months: int = 3,
    runs: int = 4,
) -> dict:
    """
    Multi-skenario: jalankan backtesting dari beberapa tanggal dasar berurutan.
    Walk-forward: setiap run mundur 1 bulan dari tanggal akhir.

    Args:
        ticker: kode saham
        end_base_date_str: tanggal dasar paling akhir (run pertama)
        horizon_months: horizon per run (3, 5, atau 6 bulan)
        runs: jumlah skenario

    Returns:
        dict ringkasan + detail semua skenario
    """
    symbol = YFinanceHelper.normalize_symbol(ticker)
    end_base_date = pd.Timestamp(end_base_date_str).date()

    cases = []
    errors = []

    for i in range(runs):
        # Walk-forward: mundur 1 bulan per run dari tanggal akhir
        run_base_date = end_base_date - timedelta(days=30 * i)
        run_base_str = str(run_base_date)

        try:
            case = run_single_fundamental_backtest(
                ticker=ticker,
                base_date_str=run_base_str,
                horizon_months=horizon_months,
            )
            cases.append(case)
        except ValueError as e:
            errors.append({"base_date": run_base_str, "error": str(e)})

    if not cases:
        raise ValueError(
            f"Semua {runs} skenario gagal. "
            f"Coba base_date yang lebih lama atau horizon yang lebih pendek."
        )

    direction_accuracy = sum(1 for c in cases if c["direction_correct"]) / len(cases) * 100
    avg_return_error   = sum(c["return_error_pct"] for c in cases) / len(cases)
    avg_actual_return  = sum(c["actual_return_pct"] for c in cases) / len(cases)
    avg_estimated_return = sum(c["estimated_return_pct"] for c in cases) / len(cases)

    rec_counts = {"BUY": 0, "HOLD": 0, "SELL": 0}
    for c in cases:
        rec_counts[c["recommendation"]] = rec_counts.get(c["recommendation"], 0) + 1

    return {
        "ticker": symbol,
        "horizon_months": horizon_months,
        "evaluation_method": f"walk-forward multi-date fundamental backtesting ({horizon_months} bulan)",
        "runs_attempted": runs,
        "runs_succeeded": len(cases),
        "runs_failed": len(errors),
        "direction_accuracy_pct": round(direction_accuracy, 2),
        "avg_return_error_pct": round(avg_return_error, 2),
        "avg_actual_return_pct": round(avg_actual_return, 2),
        "avg_estimated_return_pct": round(avg_estimated_return, 2),
        "recommendation_distribution": rec_counts,
        "interpretation": {
            "direction_accuracy": (
                "Persentase skenario di mana arah estimasi (Naik/Turun) "
                "sesuai dengan pergerakan harga aktual selama horizon."
            ),
            "avg_return_error": (
                "Rata-rata selisih absolut antara estimasi return dan return aktual."
            ),
        },
        "cases": cases,
        "errors": errors if errors else None,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Backtesting analisis fundamental saham (jangka menengah)"
    )
    parser.add_argument(
        "--ticker", required=True,
        help="Kode saham, contoh: BBCA atau BBCA.JK"
    )
    parser.add_argument(
        "--base-date", required=True,
        help="Tanggal dasar analisis (YYYY-MM-DD). Untuk multi-run: tanggal paling akhir."
    )
    parser.add_argument(
        "--horizon", type=int, default=3, choices=[3, 5, 6],
        help="Horizon prediksi dalam bulan: 3, 5, atau 6 (default: 3)"
    )
    parser.add_argument(
        "--runs", type=int, default=1,
        help="Jumlah skenario walk-forward. 1 = single test (default: 1)"
    )
    args = parser.parse_args()

    try:
        if args.runs <= 1:
            result = run_single_fundamental_backtest(
                ticker=args.ticker,
                base_date_str=args.base_date,
                horizon_months=args.horizon,
            )
        else:
            result = run_multi_fundamental_backtest(
                ticker=args.ticker,
                end_base_date_str=args.base_date,
                horizon_months=args.horizon,
                runs=args.runs,
            )
        print(json.dumps(result, indent=2, ensure_ascii=False))
    except Exception as e:
        print(
            json.dumps({"success": False, "message": str(e)}, ensure_ascii=False),
            file=sys.stderr
        )
        sys.exit(1)


if __name__ == "__main__":
    main()