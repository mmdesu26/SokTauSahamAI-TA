import yfinance as yf
# ^ Mengimpor library yfinance dengan alias 'yf'.
#   yfinance adalah library Python untuk mengambil data saham dari Yahoo Finance.
#   'as yf' artinya kita bisa memanggil yfinance cukup dengan menulis 'yf'.

from datetime import datetime, timedelta
# ^ Mengimpor class 'datetime' dan 'timedelta' dari module 'datetime'.
#   - datetime: untuk bekerja dengan tanggal dan waktu.
#   - timedelta: untuk representasi durasi/selisih waktu.

from zoneinfo import ZoneInfo
# ^ Mengimpor class 'ZoneInfo' dari module 'zoneinfo'.
#   ZoneInfo digunakan untuk menangani zona waktu (timezone), misalnya Asia/Jakarta.

import logging
# ^ Mengimpor module 'logging' bawaan Python.
#   Digunakan untuk mencatat log/pesan (info, warning, error) selama program berjalan.

from app.utils.text_helper import TextHelper
# ^ Mengimpor class 'TextHelper' dari module lokal di project (app/utils/text_helper.py).
#   Class ini kemungkinan berisi helper untuk manipulasi teks (misal translate).

# ===================================================================
# INISIALISASI LOGGER
# ===================================================================
logger = logging.getLogger(__name__)
# ^ Variabel 'logger' adalah objek logger untuk mencatat log pada file ini.
#   __name__ = nama module saat ini (otomatis terisi nama file).
#   Ini adalah PRAKTIK STANDAR Python untuk mendapatkan logger per-module.


# ===================================================================
# KELAS (CLASS) UTAMA: YFinanceHelper
# ===================================================================
# Ini adalah DEFINISI KELAS bernama 'YFinanceHelper'.
# Kelas = cetak biru/blueprint untuk membuat objek yang punya atribut & method.
# Kelas ini berfungsi sebagai HELPER CLASS (kelas pembantu) yang berisi
# kumpulan method statis untuk mengambil data saham & market dari yfinance.
class YFinanceHelper:
    """helper class buat ambil data saham & market dari yfinance"""
    # ^ Ini adalah DOCSTRING (dokumentasi kelas).
    #   Penjelasan singkat tentang fungsi kelas ini.

    # -------------------------------------------------------------------
    # ATRIBUT KELAS (CLASS ATTRIBUTE) / KONSTANTA
    # -------------------------------------------------------------------
    JAKARTA_TZ = ZoneInfo("Asia/Jakarta")
    # ^ JAKARTA_TZ adalah ATRIBUT KELAS (variabel milik kelas, bukan instance).
    #   Berisi objek timezone untuk Asia/Jakarta (WIB, UTC+7).
    #   Konvensi huruf KAPITAL menandakan ini adalah KONSTANTA (tidak diubah).

    # ===================================================================
    # METHOD STATIS (STATIC METHOD)
    # ===================================================================
    # @staticmethod = DECORATOR yang menandakan method ini bersifat statis.
    # Method statis = method yang bisa dipanggil langsung dari kelas
    # TANPA perlu membuat objek/instance terlebih dahulu.
    # Contoh pemanggilan: YFinanceHelper.normalize_symbol("BBCA")
    # Tidak butuh parameter 'self' karena tidak terikat ke instance.

    @staticmethod
    def normalize_symbol(ticker: str) -> str:
        """
        METHOD: normalize_symbol
        FUNGSI: Menormalkan/menstandarkan kode ticker saham.
                Jika saham Indonesia, tambahkan suffix '.JK' (kode Yahoo Finance IDX).
        PARAMETER:
            - ticker (str): kode saham yang akan dinormalkan.
        RETURN:
            - str: kode ticker yang sudah distandarkan.
        """
        # Variabel lokal 'symbol': hasil pembersihan ticker (hapus spasi + uppercase).
        # Operator 'or' untuk handle jika ticker = None agar tidak error .strip().
        symbol = (ticker or "").strip().upper()

        # Pengecekan: jika setelah dibersihkan ternyata string kosong, langsung return.
        if not symbol:
            return symbol

        # Pengecekan kondisi khusus:
        # - Diawali "^"    => kode index (misal ^JKSE untuk IHSG)
        # - Mengandung "=" => kode futures/komoditas (misal GC=F untuk emas)
        # - Diakhiri ".JK" => sudah berformat Yahoo Finance Indonesia
        # Jika salah satu kondisi benar, langsung return tanpa modifikasi.
        if symbol.startswith("^") or "=" in symbol or symbol.endswith(".JK"):
            return symbol

        # Jika bukan kondisi di atas, anggap saham Indonesia, tambahkan ".JK".
        # f-string (f"...") untuk format string dengan variabel.
        return f"{symbol}.JK"

    @staticmethod
    def _to_jakarta_naive(dt_value):
        """
        METHOD: _to_jakarta_naive
        FUNGSI: Mengonversi datetime ke zona waktu Jakarta, lalu membuatnya "naive"
                (tanpa info timezone).
        CATATAN: Prefix underscore (_) adalah KONVENSI Python yang menandakan
                 method ini bersifat PRIVATE (hanya untuk penggunaan internal kelas).
        PARAMETER:
            - dt_value: objek datetime yang akan dikonversi.
        RETURN:
            - datetime tanpa timezone (naive), atau None jika input None.
        """
        # Jika input None, return None langsung (defensive programming).
        if dt_value is None:
            return None

        # getattr(obj, 'attr', default) = ambil atribut 'tzinfo' dari dt_value,
        # jika tidak ada kembalikan None. Cara aman cek atribut.
        # Jika dt_value memiliki timezone info:
        if getattr(dt_value, "tzinfo", None) is not None:
            # tz_convert: konversi ke timezone Jakarta
            # tz_localize(None): hilangkan info timezone (jadi naive).
            return dt_value.tz_convert(YFinanceHelper.JAKARTA_TZ).tz_localize(None)

        # Jika sudah naive, return apa adanya.
        return dt_value

    @staticmethod
    def _format_dt(dt_value):
        """
        METHOD: _format_dt
        FUNGSI: Memformat objek datetime menjadi string "YYYY-MM-DD HH:MM".
        PARAMETER:
            - dt_value: objek datetime.
        RETURN:
            - string tanggal terformat, atau None jika input None.
        """
        if dt_value is None:
            return None
        # strftime = STRING FORMAT TIME, mengonversi datetime ke string
        # sesuai pola (format code):
        # %Y = tahun 4 digit, %m = bulan, %d = tanggal
        # %H = jam 24 jam, %M = menit
        return dt_value.strftime("%Y-%m-%d %H:%M")

    @staticmethod
    def _normalize_history_index_to_jakarta(hist):
        """
        METHOD: _normalize_history_index_to_jakarta
        FUNGSI: Menormalkan index (kolom tanggal) pada DataFrame pandas
                ke timezone Jakarta dan membuatnya naive + terurut.
        PARAMETER:
            - hist: DataFrame pandas yang berisi data historis dari yfinance.
        RETURN:
            - DataFrame dengan index yang sudah dinormalkan.
        """
        # Guard clause: jika data kosong atau None, langsung return tanpa proses.
        if hist is None or hist.empty:
            return hist

        # .copy() = membuat SALINAN DataFrame agar tidak mengubah data asli
        # (menghindari SettingWithCopyWarning di pandas).
        hist = hist.copy()

        # Cek apakah index DataFrame memiliki info timezone.
        if getattr(hist.index, "tz", None) is not None:
            # Konversi index ke timezone Jakarta, lalu hilangkan info timezone.
            hist.index = hist.index.tz_convert(YFinanceHelper.JAKARTA_TZ).tz_localize(None)
        else:
            # Jika sudah naive, tetap panggil tz_localize(None) untuk konsistensi.
            hist.index = hist.index.tz_localize(None)

        # sort_index() = urutkan data berdasarkan index (tanggal) secara ascending.
        return hist.sort_index()

    # ===================================================================
    # METHOD: get_latest_quote
    # ===================================================================
    @staticmethod
    def get_latest_quote(ticker: str):
        """
        FUNGSI: Mengambil kutipan harga TERBARU dari sebuah saham,
                termasuk harga, persentase perubahan, dan tanggal.
        PARAMETER:
            - ticker (str): kode saham.
        RETURN:
            - dict (kamus) berisi info harga terbaru, atau dict kosong jika gagal.
        """
        # Normalkan simbol terlebih dahulu (tambah .JK jika perlu).
        symbol = YFinanceHelper.normalize_symbol(ticker)

        # TRY-EXCEPT = penanganan error (exception handling).
        # Blok 'try': kode yang mungkin menyebabkan error.
        try:
            # Buat objek Ticker dari yfinance untuk simbol tertentu.
            stock = yf.Ticker(symbol)

            # Ambil data historis 10 hari dengan interval harian.
            # auto_adjust=False = tidak auto-adjust harga untuk dividen/split.
            hist = stock.history(period="10d", interval="1d", auto_adjust=False)

            # Jika hasil kosong, return dict kosong.
            if hist.empty:
                return {}

            # dropna(subset=["Close"]) = hapus baris yang kolom 'Close'-nya NaN (kosong).
            # .copy() untuk menghindari warning di pandas.
            hist = hist.dropna(subset=["Close"]).copy()
            # Normalkan index ke timezone Jakarta.
            hist = YFinanceHelper._normalize_history_index_to_jakarta(hist)

            # Cek lagi setelah filter, siapa tahu jadi kosong.
            if hist.empty:
                return {}

            # iloc[-1] = ambil baris TERAKHIR (indeks negatif = dari belakang).
            latest = hist.iloc[-1]
            # Ambil baris KEDUA dari belakang (previous), jika data > 1.
            # Ini CONDITIONAL EXPRESSION (ternary operator) Python.
            previous = hist.iloc[-2] if len(hist) > 1 else None

            # hist.index[-1] = tanggal dari baris terakhir.
            latest_dt = hist.index[-1]

            # Ambil harga Close terbaru, konversi ke float, default 0 jika None.
            # Operator 'or' di sini = fallback jika nilai None/0 jadi 0.
            current_price = float(latest.get("Close", 0) or 0)
            # Harga sebelumnya, None jika previous tidak ada.
            previous_price = float(previous.get("Close", 0) or 0) if previous is not None else None

            # Inisialisasi variabel change_pct.
            change_pct = None
            # Hitung persentase perubahan jika previous valid (bukan None dan bukan 0).
            # Rumus: ((harga_sekarang - harga_sebelumnya) / harga_sebelumnya) * 100
            if previous_price not in (None, 0):
                change_pct = ((current_price - previous_price) / previous_price) * 100

            # Return DICTIONARY (struktur data key-value) berisi hasil.
            return {
                "price": current_price,
                "changePercent": change_pct,
                "date": latest_dt.strftime("%Y-%m-%d"),
                "updatedAt": YFinanceHelper._format_dt(latest_dt),
                "source": "yfinance",
                "symbol": symbol,
            }

        # Blok 'except': dijalankan jika terjadi error di blok try.
        # 'Exception as e' = menangkap semua jenis error, simpan di variabel 'e'.
        except Exception as e:
            # Catat error ke log untuk keperluan debugging.
            logger.error(f"Error fetching latest quote for {symbol}: {str(e)}")
            # Return dict kosong sebagai fallback agar aplikasi tidak crash.
            return {}

    # ===================================================================
    # METHOD: get_stock_info
    # ===================================================================
    @staticmethod
    def get_stock_info(ticker, translate_summary=True):
        """
        FUNGSI: Mengambil informasi profil perusahaan (nama, sektor, website, dll).
        PARAMETER:
            - ticker: kode saham.
            - translate_summary (bool): flag apakah deskripsi akan diterjemahkan
              ke Bahasa Indonesia. Default True.
              Ini adalah PARAMETER DENGAN NILAI DEFAULT (default argument).
        RETURN:
            - dict berisi info perusahaan, atau dict kosong jika gagal.
        """
        symbol = YFinanceHelper.normalize_symbol(ticker)
        try:
            stock = yf.Ticker(symbol)
            # .info = atribut yfinance yang berisi dict info perusahaan.
            info = stock.info

            # Ambil deskripsi bisnis, default "" jika tidak ada.
            # 'or ""' = fallback jika info.get returns None.
            summary = info.get("longBusinessSummary", "") or ""
            # Translate ke Indonesia jika flag True, kalau tidak pakai summary asli.
            # TextHelper.translate_to_indonesian = method dari class TextHelper.
            translated_summary = TextHelper.translate_to_indonesian(summary) if translate_summary else summary

            # Return dict info perusahaan dengan key yang rapi.
            return {
                "longName": info.get("longName", ""),        # Nama panjang perusahaan
                "shortName": info.get("shortName", ""),      # Nama pendek
                "sector": info.get("sector", ""),            # Sektor industri
                "industry": info.get("industry", ""),        # Industri spesifik
                "website": info.get("website", ""),          # Website resmi
                "city": info.get("city", ""),                # Kota kantor pusat
                "country": info.get("country", ""),          # Negara
                "longBusinessSummary": translated_summary,   # Deskripsi (sudah translate)
                "longBusinessSummaryOriginal": summary,      # Deskripsi asli (English)
            }

        except Exception as e:
            logger.error(f"Error fetching stock info for {symbol}: {str(e)}")
            return {}

    # ===================================================================
    # METHOD: get_fundamentals
    # ===================================================================
    @staticmethod
    def get_fundamentals(ticker):
        """
        FUNGSI: Mengambil data FUNDAMENTAL perusahaan (rasio keuangan)
                seperti EPS, PBV, ROE, PE.
        PARAMETER:
            - ticker: kode saham.
        RETURN:
            - dict berisi rasio keuangan + raw data, atau dict kosong jika gagal.
        """
        symbol = YFinanceHelper.normalize_symbol(ticker)
        try:
            stock = yf.Ticker(symbol)
            info = stock.info

            # EPS (Earnings Per Share) = Laba per lembar saham.
            eps = info.get("trailingEps", None)
            # Harga saat ini, default 0.
            current_price = info.get("currentPrice", 0)
            # Nilai buku per lembar saham (book value).
            book_value_per_share = info.get("bookValue", 0)

            # PBV (Price to Book Value) = harga saham / nilai buku per lembar.
            # Dihitung manual. None jika book_value = 0 (cegah ZeroDivisionError).
            pbv = current_price / book_value_per_share if book_value_per_share else None

            # ROE (Return on Equity) = rasio profitabilitas terhadap ekuitas.
            roe = info.get("returnOnEquity", None)
            # yfinance mengembalikan ROE dalam bentuk desimal (mis. 0.15),
            # dikonversi ke persen (15.0) dengan dikali 100.
            if roe is not None:
                roe = roe * 100

            # PE (Price to Earnings) = rasio harga terhadap laba.
            pe = info.get("trailingPE", None)

            # Data mentah tambahan untuk keperluan analisis lebih lanjut.
            revenue = info.get("totalRevenue", None)           # Total pendapatan
            net_income = info.get("netIncomeToCommon", None)   # Laba bersih
            total_assets = info.get("totalAssets", None)       # Total aset
            total_equity = info.get("totalEquity", None)       # Total ekuitas
            market_cap = info.get("marketCap", None)           # Kapitalisasi pasar

            # Return dict terstruktur: ratio utama di level atas,
            # detail raw data dibungkus dalam 'rawData' (NESTED DICT).
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

    # ===================================================================
    # METHOD: get_historical_prices
    # ===================================================================
    @staticmethod
    def get_historical_prices(ticker, days=252, exclude_today=True):
        """
        FUNGSI: Mengambil data historis harga saham (harian).
                252 = jumlah hari trading dalam 1 tahun (standar finansial).
        PARAMETER:
            - ticker: kode saham.
            - days (int): jumlah hari data yang diinginkan. Default 252.
            - exclude_today (bool): apakah data hari ini dikecualikan. Default True.
              Alasan: data hari ini belum final (market belum tutup).
        RETURN:
            - DataFrame pandas, atau None jika tidak ada data.
        """
        symbol = YFinanceHelper.normalize_symbol(ticker)
        try:
            stock = yf.Ticker(symbol)

            # buffer lebih panjang supaya tetap cukup setelah filter hari ini / hari libur
            # max(a, b) = ambil nilai terbesar dari a dan b.
            # Tambahan 20 hari untuk buffer weekend/libur.
            period_days = max(days + 20, 60)
            hist = stock.history(period=f"{period_days}d", interval="1d", auto_adjust=False)

            # Jika tidak ada data sama sekali, log warning dan return None.
            if hist.empty:
                logger.warning(f"No historical data found for {symbol}")
                return None

            # Bersihkan data: hapus baris yang Close-nya NaN + normalkan timezone.
            hist = hist.dropna(subset=["Close"]).copy()
            hist = YFinanceHelper._normalize_history_index_to_jakarta(hist)

            if hist.empty:
                return None

            # Jika exclude_today=True, buang baris yang tanggalnya = hari ini.
            if exclude_today:
                # Ambil tanggal hari ini di zona Jakarta.
                today_jakarta = datetime.now(YFinanceHelper.JAKARTA_TZ).date()
                # Filter: hanya ambil baris yang tanggalnya < hari ini.
                # Ini BOOLEAN INDEXING di pandas.
                hist = hist[hist.index.date < today_jakarta]

            # .tail(n) = ambil n baris terakhir (data terbaru).
            hist = hist.tail(days)

            if hist.empty:
                logger.warning(f"Historical data empty after filtering for {symbol}")
                return None

            return hist

        except Exception as e:
            logger.error(f"Error fetching historical prices for {symbol}: {str(e)}")
            return None

    # ===================================================================
    # METHOD: get_last_completed_daily_close
    # ===================================================================
    @staticmethod
    def get_last_completed_daily_close(ticker):
        """
        FUNGSI: Mengambil data harga CLOSE harian terakhir yang sudah FINAL
                (market sudah tutup).
                Digunakan sebagai anchor/acuan harga untuk model/analisis.
        PARAMETER:
            - ticker: kode saham.
        RETURN:
            - dict berisi OHLC (Open, High, Low, Close) dan tanggal, atau None.
        """
        symbol = YFinanceHelper.normalize_symbol(ticker)
        try:
            # Panggil method lain di kelas yang sama untuk ambil data historis.
            # Cukup 10 hari (pasti cukup untuk dapat 1 hari terakhir yang completed).
            hist = YFinanceHelper.get_historical_prices(symbol, days=10, exclude_today=True)
            if hist is None or hist.empty:
                return None

            # Ambil baris paling terakhir dari data historis.
            last_dt = hist.index[-1]     # Tanggalnya
            last_row = hist.iloc[-1]     # Data OHLC-nya

            # Return dict lengkap dengan OHLC.
            return {
                "date": last_dt.strftime("%Y-%m-%d"),
                "updatedAt": YFinanceHelper._format_dt(last_dt),
                "close": float(last_row.get("Close", 0) or 0),  # Harga penutupan
                "open": float(last_row.get("Open", 0) or 0),    # Harga pembukaan
                "high": float(last_row.get("High", 0) or 0),    # Harga tertinggi
                "low": float(last_row.get("Low", 0) or 0),      # Harga terendah
                "symbol": symbol,
                "source": "yfinance_daily_completed",
            }
        except Exception as e:
            logger.error(f"Error fetching last completed daily close for {symbol}: {str(e)}")
            return None

    # ===================================================================
    # METHOD: get_intraday_ohlc
    # ===================================================================
    @staticmethod
    def get_intraday_ohlc(ticker, interval="60m", period="5d"):
        """
        FUNGSI: Mengambil data OHLC INTRADAY (dalam hari, per jam/menit)
                untuk hari trading terakhir.
        PARAMETER:
            - ticker: kode saham.
            - interval (str): interval candle. Default "60m" (1 jam).
              Bisa "1m", "5m", "15m", "30m", "60m", dll.
            - period (str): rentang waktu. Default "5d" (5 hari).
        RETURN:
            - dict dengan key 'candles', 'last_date', 'last_updated'.
        """
        symbol = YFinanceHelper.normalize_symbol(ticker)
        try:
            stock = yf.Ticker(symbol)

            # prepost=False = hanya jam regular trading, bukan pre/post-market.
            hist = stock.history(period=period, interval=interval, auto_adjust=False, prepost=False)

            # Jika tidak ada data, return struktur kosong (bukan dict kosong,
            # tetap ada key-nya agar konsisten untuk consumer API).
            if hist.empty:
                logger.warning(f"No intraday OHLC data found for {symbol}")
                return {"candles": [], "last_date": None, "last_updated": None}

            # Bersihkan data: hapus baris yang OHLC-nya NaN.
            # Perhatikan 'subset' berisi 4 kolom sekaligus.
            hist = hist.copy().dropna(subset=["Open", "High", "Low", "Close"])
            hist = YFinanceHelper._normalize_history_index_to_jakarta(hist)

            if hist.empty:
                return {"candles": [], "last_date": None, "last_updated": None}

            # Ambil tanggal trading terakhir.
            last_trading_date = hist.index[-1].date()
            # Filter hanya data pada tanggal trading terakhir itu saja.
            # Artinya: hanya candle di HARI TERAKHIR yang dikembalikan.
            hist = hist[hist.index.date == last_trading_date]

            # Inisialisasi list kosong untuk menampung candle.
            candles = []
            # LOOP iterasi setiap baris DataFrame.
            # iterrows() returns (index, row) untuk setiap baris.
            for idx, row in hist.iterrows():
                # Tambahkan (append) dict setiap candle ke list.
                candles.append({
                    "t": idx.strftime("%Y-%m-%d %H:%M"),  # timestamp candle
                    "open": float(row["Open"]),
                    "high": float(row["High"]),
                    "low": float(row["Low"]),
                    "close": float(row["Close"]),
                })

            # Return hasil dengan metadata tanggal.
            return {
                "candles": candles,
                "last_date": last_trading_date.strftime("%Y-%m-%d") if candles else None,
                "last_updated": hist.index[-1].strftime("%Y-%m-%d %H:%M") if candles else None,
            }

        except Exception as e:
            logger.error(f"Error fetching intraday OHLC for {symbol}: {str(e)}")
            return {"candles": [], "last_date": None, "last_updated": None}

    # ===================================================================
    # METHOD: get_range_ohlc
    # ===================================================================
    @staticmethod
    def get_range_ohlc(ticker, timeframe="7D"):
        """
        FUNGSI: Mengambil data OHLC harian untuk rentang waktu tertentu
                (7 hari atau 1 bulan).
                Cocok untuk chart grafik mini (sparkline) di UI.
        PARAMETER:
            - ticker: kode saham.
            - timeframe (str): rentang waktu, "7D" atau "1M". Default "7D".
        RETURN:
            - dict dengan candles + metadata.
        """
        symbol = YFinanceHelper.normalize_symbol(ticker)
        try:
            # Normalkan timeframe ke uppercase, default "7D" jika None.
            timeframe = (timeframe or "7D").upper()
            stock = yf.Ticker(symbol)

            # CONFIG DICT LOOKUP PATTERN:
            # Dict mapping timeframe ke konfigurasi period/interval/limit.
            # .get(key, default) untuk fallback jika timeframe tidak dikenali.
            config = {
                "7D": {"period": "1mo", "interval": "1d", "limit": 7},
                "1M": {"period": "3mo", "interval": "1d", "limit": 30},
            }.get(timeframe, {"period": "1mo", "interval": "1d", "limit": 7})

            # Ambil data sesuai konfigurasi.
            hist = stock.history(period=config["period"], interval=config["interval"], auto_adjust=False, prepost=False)
            if hist.empty:
                logger.warning(f"No OHLC range data found for {symbol} ({timeframe})")
                # Return struktur lengkap walau kosong (termasuk interval).
                return {"candles": [], "last_date": None, "last_updated": None, "interval": config["interval"]}

            hist = hist.copy().dropna(subset=["Open", "High", "Low", "Close"])
            hist = YFinanceHelper._normalize_history_index_to_jakarta(hist)

            if hist.empty:
                return {"candles": [], "last_date": None, "last_updated": None, "interval": config["interval"]}

            # Ambil N baris terakhir sesuai 'limit' (7 atau 30 hari).
            hist = hist.tail(config["limit"])
            candles = []
            for idx, row in hist.iterrows():
                candles.append({
                    "t": idx.strftime("%Y-%m-%d"),  # Tanpa jam karena data harian
                    "open": float(row["Open"]),
                    "high": float(row["High"]),
                    "low": float(row["Low"]),
                    "close": float(row["Close"]),
                })

            # Tanggal terakhir, None jika data kosong.
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

    # ===================================================================
    # METHOD: get_market_overview
    # ===================================================================
    @staticmethod
    def get_market_overview():
        """
        FUNGSI: Mengambil ringkasan pasar: IHSG (indeks saham Indonesia)
                dan harga emas (gold futures).
        PARAMETER: (tidak ada)
        RETURN:
            - dict berisi data ihsg, emas, dan timestamp 'asOf'.
        """

        # -------------------------------------------------------------------
        # NESTED FUNCTION (fungsi di dalam fungsi) - INNER HELPER FUNCTIONS
        # -------------------------------------------------------------------
        # Fungsi-fungsi ini hanya bisa diakses di dalam get_market_overview().
        # Disebut juga CLOSURE.

        def _safe_pct(current, previous):
            """
            INNER FUNCTION: menghitung persentase perubahan dengan AMAN.
            'Aman' artinya: tidak error jika previous None/0, tidak error
            jika nilai bukan angka.
            """
            # Jika previous None atau 0, return None (hindari ZeroDivisionError).
            if previous in (None, 0):
                return None
            try:
                # Konversi ke float dulu untuk memastikan bertipe angka.
                return ((float(current) - float(previous)) / float(previous)) * 100
            except Exception:
                # Jika konversi gagal (misal string tidak valid), return None.
                return None

        def _get_latest_intraday_dt(ticker_obj, fallback_dt=None):
            """
            INNER FUNCTION: ambil timestamp intraday terakhir (jam terbaru).
            Kalau gagal, gunakan fallback_dt (tanggal daily sebagai pengganti).
            """
            try:
                # Ambil data intraday 60 menit, 5 hari terakhir.
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

                # Return tanggal-jam terakhir, fallback jika None.
                # 'or' di sini = fallback pattern.
                return intraday.index[-1] or fallback_dt
            except Exception:
                return fallback_dt

        # -------------------------------------------------------------------
        # MAIN LOGIC dari get_market_overview
        # -------------------------------------------------------------------
        try:
            # Waktu sekarang di zona Jakarta.
            now = datetime.now(YFinanceHelper.JAKARTA_TZ)

            # Dict konfigurasi indeks yang akan di-fetch.
            # Struktur: {key: {symbol, label, suffix}}
            indexes = {
                "ihsg": {"symbol": "^JKSE", "label": "IHSG", "suffix": ""},
                "emas": {"symbol": "GC=F", "label": "Harga Emas", "suffix": "USD/oz"},
            }

            # Dict kosong untuk menampung hasil akhir.
            result = {}

            # LOOP setiap item di dict indexes.
            # .items() returns (key, value) pairs.
            for key, cfg in indexes.items():
                # Buat Ticker untuk simbol index/komoditas.
                ticker = yf.Ticker(cfg["symbol"])

                # Ambil data harian 5 hari terakhir.
                hist = ticker.history(period="5d", interval="1d", auto_adjust=False)

                # Jika kosong, set None dan lanjut ke iterasi berikutnya.
                # 'continue' = skip ke iterasi loop berikutnya.
                if hist.empty:
                    result[key] = None
                    continue

                hist = hist.dropna(subset=["Close"]).copy()
                hist = YFinanceHelper._normalize_history_index_to_jakarta(hist)

                if hist.empty:
                    result[key] = None
                    continue

                # Ambil harga terakhir dan sebelumnya.
                latest = hist.iloc[-1]
                previous = hist.iloc[-2] if len(hist) > 1 else None

                latest_daily_dt = hist.index[-1]
                # Panggil inner function untuk dapat waktu intraday yang lebih granular.
                latest_intraday_dt = _get_latest_intraday_dt(ticker, fallback_dt=latest_daily_dt)

                current_value = float(latest["Close"])
                previous_value = float(previous["Close"]) if previous is not None else None
                # Pakai inner function _safe_pct untuk hitung % perubahan aman.
                change_pct = _safe_pct(current_value, previous_value)

                # Pilih timestamp paling update: intraday > daily.
                effective_dt = latest_intraday_dt or latest_daily_dt
                date_str = effective_dt.strftime("%Y-%m-%d") if effective_dt else None

                # Simpan hasil ke dict result dengan key sesuai.
                result[key] = {
                    "label": cfg["label"],               # Label tampilan: "IHSG" / "Harga Emas"
                    "value": current_value,              # Nilai saat ini
                    "changePercent": change_pct,         # Persen perubahan
                    "date": date_str,                    # Tanggal
                    "source": "yfinance",                # Sumber data
                    "updatedAt": YFinanceHelper._format_dt(effective_dt),  # Waktu update
                    "unit": cfg["suffix"],               # Unit: "USD/oz" untuk emas
                    "isProxy": False,                    # Bukan data proxy (data asli)
                }

            # Tambahkan timestamp 'asOf' di level atas (kapan data diambil).
            result["asOf"] = now.strftime("%Y-%m-%d %H:%M")
            return result

        except Exception as e:
            logger.error(f"Error fetching market overview: {str(e)}")
            return {}

    # ===================================================================
    # METHOD: search_stocks
    # ===================================================================
    @staticmethod
    def search_stocks(query: str):
        """
        FUNGSI: Mencari saham berdasarkan kode ticker.
                Sederhana: hanya coba fetch dengan suffix .JK.
        PARAMETER:
            - query (str): kata kunci pencarian (biasanya kode ticker).
        RETURN:
            - list (daftar) berisi dict hasil pencarian. List kosong jika tidak ketemu.
        """
        try:
            # Inisialisasi list kosong untuk menampung hasil.
            results = []

            # Jika query sudah diakhiri .JK, pakai apa adanya. Kalau tidak, tambahkan.
            # Logika: endswith(".JK") -> true -> pakai query; false -> tambah .JK.
            query_with_jk = query.upper() if query.upper().endswith(".JK") else f"{query.upper()}.JK"

            # NESTED TRY-EXCEPT (try di dalam try).
            # Jika yfinance gagal fetch, tidak crash, tinggal return list kosong.
            try:
                stock = yf.Ticker(query_with_jk)
                info = stock.info

                # Validasi: hanya masukkan ke results jika longName tersedia.
                # Artinya ticker-nya valid dan dikenal oleh Yahoo Finance.
                if info.get("longName"):
                    # .append() = tambah elemen ke list.
                    results.append({
                        "ticker": query_with_jk.replace(".JK", ""),  # Tanpa .JK
                        "fullTicker": query_with_jk,                 # Dengan .JK
                        "name": info.get("longName", ""),            # Nama perusahaan
                        "sector": info.get("sector", ""),            # Sektor
                    })
                    return results
            except Exception:
                # Abaikan error, tetap return results (kosong).
                # 'pass' = statement kosong, tidak melakukan apa-apa.
                pass

            # Return list (kosong atau tidak, tergantung hasil).
            return results

        except Exception as e:
            logger.error(f"Error searching stocks: {str(e)}")
            # Return list kosong jika terjadi error tak terduga.
            return []