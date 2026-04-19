import argparse
import json
import sys

import numpy as np
import pandas as pd
import yfinance as yf

from app.utils.ml_predictor import StockPricePredictor
from app.utils.yfinance_helper import YFinanceHelper


LOOKBACK_DAYS = 730


def classify_error(error_pct: float) -> str:
    if error_pct <= 1:
        return "Sangat sesuai"
    if error_pct <= 3:
        return "Masih sesuai"
    return "Kurang sesuai"


def load_history(symbol: str) -> pd.DataFrame:
    stock = yf.Ticker(symbol)
    hist = stock.history(period=f"{LOOKBACK_DAYS}d", interval="1d", auto_adjust=False)
    if hist is None or hist.empty:
        raise ValueError(f"Data historis kosong untuk {symbol}")

    hist = hist.dropna(subset=["Close"]).copy()
    hist = YFinanceHelper._normalize_history_index_to_jakarta(hist)
    if hist.empty:
        raise ValueError(f"Data historis kosong setelah normalisasi untuk {symbol}")

    return hist.sort_index()


def _single_case_from_history(symbol: str, hist: pd.DataFrame, requested_base_date, days: int, lag_days: int):
    eligible = hist[hist.index.date <= requested_base_date]
    if eligible.empty:
        raise ValueError(f"Tidak ada data trading pada atau sebelum {requested_base_date} untuk {symbol}")

    base_row = eligible.iloc[-1]
    base_idx = eligible.index[-1]
    base_pos = hist.index.get_loc(base_idx)

    if base_pos >= len(hist.index) - 1:
        raise ValueError(
            "Tidak ada hari trading berikutnya setelah tanggal dasar. "
            "Pilih tanggal yang lebih lama agar harga aktual target tersedia."
        )

    actual_idx = hist.index[base_pos + 1]
    actual_row = hist.iloc[base_pos + 1]

    training_hist = hist[hist.index <= base_idx].copy()
    predictor = StockPricePredictor(
        ticker=symbol,
        days=days,
        forecast_horizon=1,
        lag_days=lag_days,
        historical_df=training_hist,
    )

    if not predictor.train_price_model():
        raise ValueError("Model gagal dilatih untuk data backtesting yang dipilih")

    prediction = predictor.predict_next_period()
    if not prediction:
        raise ValueError("Model gagal menghasilkan prediksi backtesting")

    predicted_close = float(prediction["predicted_close_next_day"])
    actual_close = float(actual_row["Close"])
    base_close = float(base_row["Close"])
    baseline_close = base_close

    absolute_error = abs(predicted_close - actual_close)
    error_pct = (absolute_error / actual_close) * 100 if actual_close else 0.0
    baseline_absolute_error = abs(baseline_close - actual_close)
    baseline_error_pct = (baseline_absolute_error / actual_close) * 100 if actual_close else 0.0

    actual_direction = float(np.sign(actual_close - base_close))
    predicted_direction = float(np.sign(predicted_close - base_close))
    baseline_direction = 0.0

    return {
        "ticker": symbol,
        "requested_base_date": str(requested_base_date),
        "actual_base_date_used": base_idx.strftime("%Y-%m-%d"),
        "base_close": round(base_close, 2),
        "target_date": actual_idx.strftime("%Y-%m-%d"),
        "actual_close_target": round(actual_close, 2),
        "predicted_close_target": round(predicted_close, 2),
        "baseline_close_target": round(baseline_close, 2),
        "absolute_error": round(absolute_error, 2),
        "error_percentage": round(error_pct, 4),
        "baseline_absolute_error": round(baseline_absolute_error, 2),
        "baseline_error_percentage": round(baseline_error_pct, 4),
        "classification": classify_error(error_pct),
        "model_beats_baseline": error_pct < baseline_error_pct,
        "direction_correct": bool(actual_direction == predicted_direction),
        "baseline_direction_correct": bool(actual_direction == baseline_direction),
        "accuracy_metric": "MAPE",
        "model_mape": prediction.get("mape"),
        "notes": {
            "rule_1": "Sangat sesuai jika error <= 1%",
            "rule_2": "Masih sesuai jika error > 1% dan <= 3%",
            "rule_3": "Kurang sesuai jika error > 3%",
            "baseline": "Harga target diasumsikan sama dengan close hari dasar",
        },
    }


def run_single_backtest(ticker: str, base_date: str, days: int = 365, lag_days: int = 10):
    symbol = YFinanceHelper.normalize_symbol(ticker)
    requested_base_date = pd.Timestamp(base_date).date()
    hist = load_history(symbol)
    return _single_case_from_history(symbol, hist, requested_base_date, days, lag_days)


def run_multi_backtest(ticker: str, end_base_date: str, runs: int = 5, days: int = 365, lag_days: int = 10):
    symbol = YFinanceHelper.normalize_symbol(ticker)
    hist = load_history(symbol)
    max_date = pd.Timestamp(end_base_date).date()
    candidate_dates = [d for d in hist.index.date[:-1] if d <= max_date]
    if not candidate_dates:
        raise ValueError("Tidak ada tanggal backtesting yang memenuhi syarat")

    selected_dates = candidate_dates[-runs:]
    cases = [_single_case_from_history(symbol, hist, d, days, lag_days) for d in selected_dates]

    return {
        "ticker": symbol,
        "evaluation_method": "walk-forward multi-date backtesting",
        "runs": len(cases),
        "avg_error_percentage": round(float(np.mean([c["error_percentage"] for c in cases])), 4),
        "avg_baseline_error_percentage": round(float(np.mean([c["baseline_error_percentage"] for c in cases])), 4),
        "directional_accuracy": round(float(np.mean([1 if c["direction_correct"] else 0 for c in cases]) * 100), 2),
        "baseline_directional_accuracy": round(float(np.mean([1 if c["baseline_direction_correct"] else 0 for c in cases]) * 100), 2),
        "model_beats_baseline_count": int(sum(1 for c in cases if c["model_beats_baseline"])),
        "cases": cases,
    }


def main():
    parser = argparse.ArgumentParser(description="Jalankan backtesting prediksi harga saham")
    parser.add_argument("--ticker", required=True, help="Ticker saham, contoh: BBCA atau BBCA.JK")
    parser.add_argument("--base-date", required=True, help="Tanggal dasar prediksi, format YYYY-MM-DD")
    parser.add_argument("--days", type=int, default=365, help="Jumlah hari historis untuk training model")
    parser.add_argument("--lag-days", type=int, default=10, help="Jumlah lag closing price")
    parser.add_argument("--runs", type=int, default=1, help="Jumlah skenario backtesting berurutan. 1 = single test")
    args = parser.parse_args()

    try:
        if args.runs <= 1:
            result = run_single_backtest(
                ticker=args.ticker,
                base_date=args.base_date,
                days=args.days,
                lag_days=args.lag_days,
            )
        else:
            result = run_multi_backtest(
                ticker=args.ticker,
                end_base_date=args.base_date,
                runs=args.runs,
                days=args.days,
                lag_days=args.lag_days,
            )
        print(json.dumps(result, indent=2, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"success": False, "message": str(e)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
