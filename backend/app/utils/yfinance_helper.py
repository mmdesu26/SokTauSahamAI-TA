import yfinance as yf
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import logging
from app.utils.text_helper import TextHelper

logger = logging.getLogger(__name__)


class YFinanceHelper:
    """helper class buat ambil data saham & market dari yfinance"""

    JAKARTA_TZ = ZoneInfo("Asia/Jakarta")

    @staticmethod
    def normalize_symbol(ticker: str) -> str:
        symbol = (ticker or "").strip().upper()
        if not symbol:
            return symbol

        if symbol.startswith("^") or "=" in symbol or symbol.endswith(".JK"):
            return symbol

        return f"{symbol}.JK"

    @staticmethod
    def _to_jakarta_naive(dt_value):
        if dt_value is None:
            return None
        if getattr(dt_value, "tzinfo", None) is not None:
            return dt_value.tz_convert(YFinanceHelper.JAKARTA_TZ).tz_localize(None)
        return dt_value

    @staticmethod
    def _format_dt(dt_value):
        if dt_value is None:
            return None
        return dt_value.strftime("%Y-%m-%d %H:%M")

    @staticmethod
    def _normalize_history_index_to_jakarta(hist):
        if hist is None or hist.empty:
            return hist

        hist = hist.copy()

        if getattr(hist.index, "tz", None) is not None:
            hist.index = hist.index.tz_convert(YFinanceHelper.JAKARTA_TZ).tz_localize(None)
        else:
            hist.index = hist.index.tz_localize(None)

        return hist.sort_index()

    @staticmethod
    def get_latest_quote(ticker: str):
        symbol = YFinanceHelper.normalize_symbol(ticker)
        try:
            stock = yf.Ticker(symbol)
            hist = stock.history(period="10d", interval="1d", auto_adjust=False)

            if hist.empty:
                return {}

            hist = hist.dropna(subset=["Close"]).copy()
            hist = YFinanceHelper._normalize_history_index_to_jakarta(hist)

            if hist.empty:
                return {}

            latest = hist.iloc[-1]
            previous = hist.iloc[-2] if len(hist) > 1 else None

            latest_dt = hist.index[-1]

            current_price = float(latest.get("Close", 0) or 0)
            previous_price = float(previous.get("Close", 0) or 0) if previous is not None else None

            change_pct = None
            if previous_price not in (None, 0):
                change_pct = ((current_price - previous_price) / previous_price) * 100

            return {
                "price": current_price,
                "changePercent": change_pct,
                "date": latest_dt.strftime("%Y-%m-%d"),
                "updatedAt": YFinanceHelper._format_dt(latest_dt),
                "source": "yfinance",
                "symbol": symbol,
            }

        except Exception as e:
            logger.error(f"Error fetching latest quote for {symbol}: {str(e)}")
            return {}

    @staticmethod
    def get_stock_info(ticker, translate_summary=True):
        symbol = YFinanceHelper.normalize_symbol(ticker)
        try:
            stock = yf.Ticker(symbol)
            info = stock.info

            summary = info.get("longBusinessSummary", "") or ""
            translated_summary = TextHelper.translate_to_indonesian(summary) if translate_summary else summary

            return {
                "longName": info.get("longName", ""),
                "shortName": info.get("shortName", ""),
                "sector": info.get("sector", ""),
                "industry": info.get("industry", ""),
                "website": info.get("website", ""),
                "city": info.get("city", ""),
                "country": info.get("country", ""),
                "longBusinessSummary": translated_summary,
                "longBusinessSummaryOriginal": summary,
            }

        except Exception as e:
            logger.error(f"Error fetching stock info for {symbol}: {str(e)}")
            return {}

    @staticmethod
    def get_fundamentals(ticker):
        symbol = YFinanceHelper.normalize_symbol(ticker)
        try:
            stock = yf.Ticker(symbol)
            info = stock.info

            eps = info.get("trailingEps", None)
            current_price = info.get("currentPrice", 0)
            book_value_per_share = info.get("bookValue", 0)

            pbv = current_price / book_value_per_share if book_value_per_share else None

            roe = info.get("returnOnEquity", None)
            if roe is not None:
                roe = roe * 100

            pe = info.get("trailingPE", None)

            revenue = info.get("totalRevenue", None)
            net_income = info.get("netIncomeToCommon", None)
            total_assets = info.get("totalAssets", None)
            total_equity = info.get("totalEquity", None)
            market_cap = info.get("marketCap", None)

            return {
                "eps": eps,
                "pbv": pbv,
                "roe": roe,
                "pe": pe,
                "rawData": {
                    "currentPrice": current_price,
                    "bookValuePerShare": book_value_per_share,
                    "revenue": revenue,
                    "netIncome": net_income,
                    "totalAssets": total_assets,
                    "totalEquity": total_equity,
                    "marketCap": market_cap,
                }
            }

        except Exception as e:
            logger.error(f"Error fetching fundamentals for {symbol}: {str(e)}")
            return {}

    @staticmethod
    def get_historical_prices(ticker, days=252, exclude_today=True):
        """
        Ambil data daily historical yang stabil untuk model.
        Pakai period agar tidak bermasalah dengan timezone/start-end.
        """
        symbol = YFinanceHelper.normalize_symbol(ticker)
        try:
            stock = yf.Ticker(symbol)

            # buffer lebih panjang supaya tetap cukup setelah filter hari ini / hari libur
            period_days = max(days + 20, 60)
            hist = stock.history(period=f"{period_days}d", interval="1d", auto_adjust=False)

            if hist.empty:
                logger.warning(f"No historical data found for {symbol}")
                return None

            hist = hist.dropna(subset=["Close"]).copy()
            hist = YFinanceHelper._normalize_history_index_to_jakarta(hist)

            if hist.empty:
                return None

            if exclude_today:
                today_jakarta = datetime.now(YFinanceHelper.JAKARTA_TZ).date()
                hist = hist[hist.index.date < today_jakarta]

            hist = hist.tail(days)

            if hist.empty:
                logger.warning(f"Historical data empty after filtering for {symbol}")
                return None

            return hist

        except Exception as e:
            logger.error(f"Error fetching historical prices for {symbol}: {str(e)}")
            return None

    @staticmethod
    def get_last_completed_daily_close(ticker):
        """
        Ambil close harian terakhir yang sudah completed.
        Ini yang seharusnya dipakai model sebagai anchor current price.
        """
        symbol = YFinanceHelper.normalize_symbol(ticker)
        try:
            hist = YFinanceHelper.get_historical_prices(symbol, days=10, exclude_today=True)
            if hist is None or hist.empty:
                return None

            last_dt = hist.index[-1]
            last_row = hist.iloc[-1]

            return {
                "date": last_dt.strftime("%Y-%m-%d"),
                "updatedAt": YFinanceHelper._format_dt(last_dt),
                "close": float(last_row.get("Close", 0) or 0),
                "open": float(last_row.get("Open", 0) or 0),
                "high": float(last_row.get("High", 0) or 0),
                "low": float(last_row.get("Low", 0) or 0),
                "symbol": symbol,
                "source": "yfinance_daily_completed",
            }
        except Exception as e:
            logger.error(f"Error fetching last completed daily close for {symbol}: {str(e)}")
            return None

    @staticmethod
    def get_intraday_ohlc(ticker, interval="60m", period="5d"):
        symbol = YFinanceHelper.normalize_symbol(ticker)
        try:
            stock = yf.Ticker(symbol)

            hist = stock.history(period=period, interval=interval, auto_adjust=False, prepost=False)

            if hist.empty:
                logger.warning(f"No intraday OHLC data found for {symbol}")
                return {"candles": [], "last_date": None, "last_updated": None}

            hist = hist.copy().dropna(subset=["Open", "High", "Low", "Close"])
            hist = YFinanceHelper._normalize_history_index_to_jakarta(hist)

            if hist.empty:
                return {"candles": [], "last_date": None, "last_updated": None}

            last_trading_date = hist.index[-1].date()
            hist = hist[hist.index.date == last_trading_date]

            candles = []
            for idx, row in hist.iterrows():
                candles.append({
                    "t": idx.strftime("%Y-%m-%d %H:%M"),
                    "open": float(row["Open"]),
                    "high": float(row["High"]),
                    "low": float(row["Low"]),
                    "close": float(row["Close"]),
                })

            return {
                "candles": candles,
                "last_date": last_trading_date.strftime("%Y-%m-%d") if candles else None,
                "last_updated": hist.index[-1].strftime("%Y-%m-%d %H:%M") if candles else None,
            }

        except Exception as e:
            logger.error(f"Error fetching intraday OHLC for {symbol}: {str(e)}")
            return {"candles": [], "last_date": None, "last_updated": None}

    @staticmethod
    def get_range_ohlc(ticker, timeframe="7D"):
        symbol = YFinanceHelper.normalize_symbol(ticker)
        try:
            timeframe = (timeframe or "7D").upper()
            stock = yf.Ticker(symbol)

            config = {
                "7D": {"period": "1mo", "interval": "1d", "limit": 7},
                "1M": {"period": "3mo", "interval": "1d", "limit": 30},
            }.get(timeframe, {"period": "1mo", "interval": "1d", "limit": 7})

            hist = stock.history(period=config["period"], interval=config["interval"], auto_adjust=False, prepost=False)
            if hist.empty:
                logger.warning(f"No OHLC range data found for {symbol} ({timeframe})")
                return {"candles": [], "last_date": None, "last_updated": None, "interval": config["interval"]}

            hist = hist.copy().dropna(subset=["Open", "High", "Low", "Close"])
            hist = YFinanceHelper._normalize_history_index_to_jakarta(hist)

            if hist.empty:
                return {"candles": [], "last_date": None, "last_updated": None, "interval": config["interval"]}

            hist = hist.tail(config["limit"])
            candles = []
            for idx, row in hist.iterrows():
                candles.append({
                    "t": idx.strftime("%Y-%m-%d"),
                    "open": float(row["Open"]),
                    "high": float(row["High"]),
                    "low": float(row["Low"]),
                    "close": float(row["Close"]),
                })

            last_dt = hist.index[-1] if len(hist.index) else None
            return {
                "candles": candles,
                "last_date": last_dt.strftime("%Y-%m-%d") if last_dt else None,
                "last_updated": YFinanceHelper._format_dt(last_dt),
                "interval": config["interval"],
            }
        except Exception as e:
            logger.error(f"Error fetching OHLC range for {symbol}: {str(e)}")
            return {"candles": [], "last_date": None, "last_updated": None, "interval": "1d"}

    @staticmethod
    def get_market_overview():
        def _safe_pct(current, previous):
            if previous in (None, 0):
                return None
            try:
                return ((float(current) - float(previous)) / float(previous)) * 100
            except Exception:
                return None

        def _get_latest_intraday_dt(ticker_obj, fallback_dt=None):
            try:
                intraday = ticker_obj.history(
                    period="5d",
                    interval="60m",
                    auto_adjust=False,
                    prepost=False,
                )

                if intraday.empty:
                    return fallback_dt

                intraday = intraday.dropna(subset=["Close"]).copy()
                intraday = YFinanceHelper._normalize_history_index_to_jakarta(intraday)

                if intraday.empty:
                    return fallback_dt

                return intraday.index[-1] or fallback_dt
            except Exception:
                return fallback_dt

        try:
            now = datetime.now(YFinanceHelper.JAKARTA_TZ)

            indexes = {
                "ihsg": {"symbol": "^JKSE", "label": "IHSG", "suffix": ""},
                "emas": {"symbol": "GC=F", "label": "Harga Emas", "suffix": "USD/oz"},
            }

            result = {}

            for key, cfg in indexes.items():
                ticker = yf.Ticker(cfg["symbol"])

                hist = ticker.history(period="5d", interval="1d", auto_adjust=False)

                if hist.empty:
                    result[key] = None
                    continue

                hist = hist.dropna(subset=["Close"]).copy()
                hist = YFinanceHelper._normalize_history_index_to_jakarta(hist)

                if hist.empty:
                    result[key] = None
                    continue

                latest = hist.iloc[-1]
                previous = hist.iloc[-2] if len(hist) > 1 else None

                latest_daily_dt = hist.index[-1]
                latest_intraday_dt = _get_latest_intraday_dt(ticker, fallback_dt=latest_daily_dt)

                current_value = float(latest["Close"])
                previous_value = float(previous["Close"]) if previous is not None else None
                change_pct = _safe_pct(current_value, previous_value)

                effective_dt = latest_intraday_dt or latest_daily_dt
                date_str = effective_dt.strftime("%Y-%m-%d") if effective_dt else None

                result[key] = {
                    "label": cfg["label"],
                    "value": current_value,
                    "changePercent": change_pct,
                    "date": date_str,
                    "source": "yfinance",
                    "updatedAt": YFinanceHelper._format_dt(effective_dt),
                    "unit": cfg["suffix"],
                    "isProxy": False,
                }

            result["asOf"] = now.strftime("%Y-%m-%d %H:%M")
            return result

        except Exception as e:
            logger.error(f"Error fetching market overview: {str(e)}")
            return {}

    @staticmethod
    def search_stocks(query: str):
        try:
            results = []

            query_with_jk = query.upper() if query.upper().endswith(".JK") else f"{query.upper()}.JK"

            try:
                stock = yf.Ticker(query_with_jk)
                info = stock.info

                if info.get("longName"):
                    results.append({
                        "ticker": query_with_jk.replace(".JK", ""),
                        "fullTicker": query_with_jk,
                        "name": info.get("longName", ""),
                        "sector": info.get("sector", ""),
                    })
                    return results
            except Exception:
                pass

            return results

        except Exception as e:
            logger.error(f"Error searching stocks: {str(e)}")
            return []