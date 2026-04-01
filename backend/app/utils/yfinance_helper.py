import yfinance as yf  # library buat ambil data saham dari Yahoo Finance
from datetime import datetime, timedelta  # buat ngatur waktu / tanggal
from zoneinfo import ZoneInfo
import logging  # buat nampilin log error
from app.utils.text_helper import TextHelper  # helper buat translate text

logger = logging.getLogger(__name__)  # bikin logger buat debug/error


class YFinanceHelper:
    """helper class buat ambil data saham & market dari yfinance"""

    JAKARTA_TZ = ZoneInfo("Asia/Jakarta")

    @staticmethod
    def normalize_symbol(ticker: str) -> str:
        symbol = (ticker or "").strip().upper()  # rapihin ticker: hapus spasi, jadi huruf besar
        if not symbol:
            return symbol  # kalau kosong, balikin kosong

        # kalau udah format khusus, ga usah ditambahin .JK
        if symbol.startswith("^") or "=" in symbol or symbol.endswith(".JK"):
            return symbol

        return f"{symbol}.JK"  # default anggap saham indonesia, jadi ditambah .JK

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
    def get_latest_quote(ticker: str):
        symbol = YFinanceHelper.normalize_symbol(ticker)  # ubah ticker ke format yg sesuai
        try:
            stock = yf.Ticker(symbol)  # ambil object saham
            hist = stock.history(period="5d", interval="1d", auto_adjust=False)  # ambil data 5 hari terakhir

            if hist.empty:
                return {}  # kalau ga ada data, balikin dict kosong

            hist = hist.dropna(subset=["Close"]).copy()  # hapus baris yg close-nya kosong
            if hist.empty:
                return {}

            latest = hist.iloc[-1]  # data paling baru
            previous = hist.iloc[-2] if len(hist) > 1 else None  # data sebelumnya kalau ada

            latest_dt = hist.index[-1]  # tanggal data terakhir

            latest_dt = YFinanceHelper._to_jakarta_naive(latest_dt)

            current_price = float(latest.get("Close", 0) or 0)  # harga close terbaru
            previous_price = float(previous.get("Close", 0) or 0) if previous is not None else None  # harga close sebelumnya

            change_pct = None
            if previous_price not in (None, 0):
                change_pct = ((current_price - previous_price) / previous_price) * 100  # hitung persen perubahan

            return {
                "price": current_price,  # harga sekarang
                "changePercent": change_pct,  # persentase naik/turun
                "date": latest_dt.strftime("%Y-%m-%d"),  # tanggal data
                "updatedAt": YFinanceHelper._format_dt(latest_dt),  # tanggal + jam update
                "source": "yfinance",  # sumber data
                "symbol": symbol,  # simbol saham final
            }

        except Exception as e:
            logger.error(f"Error fetching latest quote for {symbol}: {str(e)}")  # log kalau error
            return {}

    @staticmethod
    def get_stock_info(ticker, translate_summary=True):
        try:
            symbol = YFinanceHelper.normalize_symbol(ticker)  # format ticker
            stock = yf.Ticker(symbol)  # object saham
            info = stock.info  # info detail perusahaan

            summary = info.get("longBusinessSummary", "") or ""  # deskripsi perusahaan
            translated_summary = TextHelper.translate_to_indonesian(summary) if translate_summary else summary
            # kalau translate_summary=True, summary diterjemahin ke indo

            return {
                "longName": info.get("longName", ""),  # nama panjang perusahaan
                "shortName": info.get("shortName", ""),  # nama singkat
                "sector": info.get("sector", ""),  # sektor
                "industry": info.get("industry", ""),  # industri
                "website": info.get("website", ""),  # website resmi
                "city": info.get("city", ""),  # kota
                "country": info.get("country", ""),  # negara
                "longBusinessSummary": translated_summary,  # summary versi indo
                "longBusinessSummaryOriginal": summary,  # summary asli
            }

        except Exception as e:
            logger.error(f"Error fetching stock info for {symbol}: {str(e)}")
            return {}

    @staticmethod
    def get_fundamentals(ticker):
        try:
            symbol = YFinanceHelper.normalize_symbol(ticker)  # format ticker
            stock = yf.Ticker(symbol)
            info = stock.info  # ambil info fundamental

            eps = info.get("trailingEps", None)  # EPS
            current_price = info.get("currentPrice", 0)  # harga sekarang
            book_value_per_share = info.get("bookValue", 0)  # nilai buku per saham

            pbv = current_price / book_value_per_share if book_value_per_share else None
            # PBV = harga saham / book value per share

            roe = info.get("returnOnEquity", None)  # ROE biasanya dalam desimal
            if roe is not None:
                roe = roe * 100  # ubah ke persen

            pe = info.get("trailingPE", None)  # PER

            # data tambahan buat rawData
            revenue = info.get("totalRevenue", None)  # total pendapatan
            net_income = info.get("netIncomeToCommon", None)  # laba bersih
            total_assets = info.get("totalAssets", None)  # total aset
            total_equity = info.get("totalEquity", None)  # total ekuitas
            market_cap = info.get("marketCap", None)  # market cap

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
    def get_ohlc_data(ticker, days=252, exclude_today=True):
        try:
            end_date = datetime.now()  # tanggal akhir = sekarang
            start_date = end_date - timedelta(days=days + 5)
            # ambil lebih dari jumlah hari yg diminta, buat jaga2 kalau ada hari libur

            symbol = YFinanceHelper.normalize_symbol(ticker)
            stock = yf.Ticker(symbol)
            hist = stock.history(start=start_date, end=end_date, interval="1d", auto_adjust=False)
            # ambil data harian OHLC

            if hist.empty:
                logger.warning(f"No historical data found for {symbol}")
                return []

            today_key = datetime.now().strftime("%Y-%m-%d")  # tanggal hari ini
            data = []

            for date, row in hist.iterrows():
                date_key = date.strftime("%Y-%m-%d")

                if exclude_today and date_key >= today_key:
                    continue  # kalau exclude_today aktif, data hari ini dilewati

                data.append({
                    "date": date_key,  # tanggal
                    "open": float(row["Open"]),  # harga buka
                    "high": float(row["High"]),  # harga tertinggi
                    "low": float(row["Low"]),  # harga terendah
                    "close": float(row["Close"]),  # harga tutup
                    "timestamp": int(date.timestamp()),  # timestamp unix
                })

            return data[-days:]  # balikin sesuai jumlah hari yg diminta

        except Exception as e:
            logger.error(f"Error fetching OHLC data for {symbol}: {str(e)}")
            return []

    @staticmethod
    def get_historical_prices(ticker, days=252, exclude_today=True):
        try:
            end_date = datetime.now()  # waktu akhir
            start_date = end_date - timedelta(days=days + 5)  # waktu awal + buffer

            symbol = YFinanceHelper.normalize_symbol(ticker)
            stock = yf.Ticker(symbol)
            hist = stock.history(start=start_date, end=end_date, interval="1d", auto_adjust=False)

            if hist.empty:
                logger.warning(f"No historical data found for {symbol}")
                return None

            hist = hist.copy()

            # kalau index ada timezone, dihapus dulu biar aman
            hist.index = hist.index.tz_localize(None) if getattr(hist.index, 'tz', None) is not None else hist.index

            if exclude_today:
                today = datetime.now().date()
                hist = hist[hist.index.date < today]  # buang data hari ini

            return hist.tail(days)  # ambil data paling akhir sesuai jumlah hari

        except Exception as e:
            logger.error(f"Error fetching historical prices for {symbol}: {str(e)}")
            return None

    @staticmethod
    def get_intraday_ohlc(ticker, interval="60m", period="5d"):
        try:
            symbol = YFinanceHelper.normalize_symbol(ticker)
            stock = yf.Ticker(symbol)

            hist = stock.history(period=period, interval=interval, auto_adjust=False, prepost=False)
            # ambil data intraday, misalnya per 60 menit selama 5 hari

            if hist.empty:
                logger.warning(f"No intraday OHLC data found for {symbol}")
                return {"candles": [], "last_date": None, "last_updated": None}

            hist = hist.copy().dropna(subset=["Open", "High", "Low", "Close"])
            # hapus data candle yg kosong

            if getattr(hist.index, "tz", None) is not None:
                hist.index = hist.index.tz_convert(YFinanceHelper.JAKARTA_TZ).tz_localize(None)
                # convert timezone ke jakarta

            last_trading_date = hist.index[-1].date()  # ambil tanggal trading terakhir
            hist = hist[hist.index.date == last_trading_date]
            # cuma ambil candle pada hari trading terakhir aja

            candles = []
            for idx, row in hist.iterrows():
                candles.append({
                    "t": idx.strftime("%Y-%m-%d %H:%M"),  # waktu candle
                    "open": float(row["Open"]),
                    "high": float(row["High"]),
                    "low": float(row["Low"]),
                    "close": float(row["Close"]),
                })

            return {
                "candles": candles,  # list candle
                "last_date": last_trading_date.strftime("%Y-%m-%d") if candles else None,  # tanggal terakhir
                "last_updated": hist.index[-1].strftime("%Y-%m-%d %H:%M") if candles else None,  # update terakhir
            }

        except Exception as e:
            logger.error(f"Error fetching intraday OHLC for {symbol}: {str(e)}")
            return {"candles": [], "last_date": None, "last_updated": None}

    @staticmethod
    def get_range_ohlc(ticker, timeframe="7D"):
        try:
            timeframe = (timeframe or "7D").upper()
            symbol = YFinanceHelper.normalize_symbol(ticker)
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
            if hist.empty:
                return {"candles": [], "last_date": None, "last_updated": None, "interval": config["interval"]}

            if getattr(hist.index, "tz", None) is not None:
                hist.index = hist.index.tz_convert(YFinanceHelper.JAKARTA_TZ).tz_localize(None)

            hist = hist.tail(config["limit"])
            candles = []
            for idx, row in hist.iterrows():
                idx = YFinanceHelper._to_jakarta_naive(idx)
                candles.append({
                    "t": idx.strftime("%Y-%m-%d"),
                    "open": float(row["Open"]),
                    "high": float(row["High"]),
                    "low": float(row["Low"]),
                    "close": float(row["Close"]),
                })

            last_dt = YFinanceHelper._to_jakarta_naive(hist.index[-1]) if len(hist.index) else None
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
                return None  # kalau data sebelumnya ga ada / 0, ga bisa hitung persen
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
                if intraday.empty:
                    return fallback_dt

                last_idx = intraday.index[-1]
                last_dt = YFinanceHelper._to_jakarta_naive(last_idx)

                return last_dt or fallback_dt
            except Exception:
                return fallback_dt

        try:
            now = datetime.now(YFinanceHelper.JAKARTA_TZ)  # waktu sekarang

            # daftar market yg mau diambil
            indexes = {
                "ihsg": {"symbol": "^JKSE", "label": "IHSG", "suffix": ""},
                "emas": {"symbol": "GC=F", "label": "Harga Emas", "suffix": "USD/oz"},
            }

            result = {}

            for key, cfg in indexes.items():
                ticker = yf.Ticker(cfg["symbol"])

                hist = ticker.history(period="5d", interval="1d", auto_adjust=False)
                # daily dipakai buat nilai close & persen perubahan

                if hist.empty:
                    result[key] = None
                    continue

                hist = hist.dropna(subset=["Close"]).copy()
                if hist.empty:
                    result[key] = None
                    continue

                latest = hist.iloc[-1]  # data daily terbaru
                previous = hist.iloc[-2] if len(hist) > 1 else None  # data sebelumnya

                latest_daily_dt = YFinanceHelper._to_jakarta_naive(hist.index[-1])
                latest_intraday_dt = _get_latest_intraday_dt(ticker, fallback_dt=latest_daily_dt)

                current_value = float(latest["Close"])  # nilai terbaru
                previous_value = float(previous["Close"]) if previous is not None else None  # nilai sebelumnya
                change_pct = _safe_pct(current_value, previous_value)  # persen perubahan

                effective_dt = latest_intraday_dt or latest_daily_dt
                date_str = effective_dt.strftime("%Y-%m-%d") if effective_dt else None  # tanggal update terbaru

                result[key] = {
                    "label": cfg["label"],  # nama label
                    "value": current_value,  # nilai sekarang
                    "changePercent": change_pct,  # persen perubahan
                    "date": date_str,  # tanggal update terbaru
                    "source": "yfinance",  # sumber
                    "updatedAt": YFinanceHelper._format_dt(effective_dt),
                    "unit": cfg["suffix"],  # satuan
                    "isProxy": False,
                }

            result["asOf"] = now.strftime("%Y-%m-%d %H:%M")  # waktu data diambil
            return result

        except Exception as e:
            logger.error(f"Error fetching market overview: {str(e)}")
            return {}

    @staticmethod
    def search_stocks(query: str):
        try:
            results = []  # list hasil pencarian

            query_with_jk = query.upper() if query.upper().endswith(".JK") else f"{query.upper()}.JK"
            # kalau user belum nulis .JK, tambahin otomatis

            try:
                stock = yf.Ticker(query_with_jk)
                info = stock.info  # cek info saham

                if info.get("longName"):
                    results.append({
                        "ticker": query_with_jk.replace(".JK", ""),  # ticker tanpa .JK
                        "fullTicker": query_with_jk,  # ticker lengkap
                        "name": info.get("longName", ""),  # nama perusahaan
                        "sector": info.get("sector", ""),  # sektor
                    })
                    return results  # kalau ketemu langsung return
            except Exception:
                pass  # kalau error di pencarian ini, lanjut return kosong

            return results

        except Exception as e:
            logger.error(f"Error searching stocks: {str(e)}")
            return [] 