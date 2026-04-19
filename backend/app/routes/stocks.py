# ============================================================
# stocks.py — semua endpoint public buat data saham
# Endpoint utama: list saham, detail, candlestick, prediksi AI, fundamentals
# ============================================================

from flask import Blueprint, request, jsonify  # framework web
from app import db  # SQLAlchemy instance
from app.models import Stock, StockProfile, StockFundamental, StockPriceHistory  # model DB
from app.utils.logger import log_prediction, log_external_service  # helper logging
from app.utils.ml_predictor import predict_stock_price  # fungsi prediksi ML
from app.utils.yfinance_helper import YFinanceHelper  # wrapper yfinance
from app.utils.text_helper import TextHelper  # helper translate

stocks_bp = Blueprint("stocks_bp", __name__)  # blueprint buat grouping route

PUBLIC_TIMEFRAMES = {"1D", "7D", "1M"}  # whitelist timeframe yg boleh


def _request_ip():
    # ambil IP user — kalau di balik proxy pake X-Forwarded-For
    return request.headers.get("X-Forwarded-For", request.remote_addr)


def _sanitize_daily_histories(histories):
    # buang row history yg labelnya kosong biar grafik nggak patah
    cleaned = []
    for item in histories:
        if not item.label:  # skip kalau label kosong
            continue
        cleaned.append(item)  # kumpulin yg valid
    return cleaned


def _build_virtual_stock(ticker, stock=None):
    # bikin payload "virtual" kalau ticker belum ke-seed di DB
    quote = YFinanceHelper.get_latest_quote(ticker)  # ambil harga terakhir
    info = YFinanceHelper.get_stock_info(ticker, translate_summary=False)  # ambil profil
    if stock:  # kalau ada di DB -> pake data DB
        return stock.to_dict()
    # kalau belum ke-seed -> rakit dari yfinance
    return {
        "id": None,
        "ticker": ticker.upper(),
        "name": info.get("longName") or info.get("shortName") or ticker.upper(),
        "sector": info.get("sector") or "-",
        "price": str(quote.get("price") or 0),
        "change": f"{(quote.get('changePercent') or 0):.2f}%",
        "status": "Active",
        "lastUpdated": quote.get("updatedAt"),
        "created_at": None,
        "updated_at": None,
    }


# ============================================================
# ROUTE 1: list semua saham
# ============================================================
@stocks_bp.route("/stocks", methods=["GET"])
def get_stocks():
    search = request.args.get("search", "").strip()  # query cari
    status = request.args.get("status", "").strip()  # filter status
    query = Stock.query  # query builder

    if search:  # kalau ada keyword cari
        keyword = f"%{search}%"  # pattern LIKE
        query = query.filter(
            db.or_(  # cari di ticker ATAU nama ATAU sektor
                Stock.ticker.ilike(keyword),
                Stock.name.ilike(keyword),
                Stock.sector.ilike(keyword)
            )
        )

    if status:  # filter status (Active/Inactive)
        query = query.filter(Stock.status == status)

    items = query.order_by(Stock.ticker.asc()).all()  # urutin A-Z, eksekusi query
    return jsonify({"success": True, "data": [item.to_dict() for item in items]}), 200


# ============================================================
# ROUTE 2: detail basic satu ticker (dari DB aja)
# ============================================================
@stocks_bp.route("/stocks/<string:ticker>", methods=["GET"])
def get_stock_detail(ticker):
    stock = Stock.query.filter_by(ticker=ticker.upper()).first()  # ambil dari DB
    if not stock:  # nggak ada -> 404
        return jsonify({"success": False, "message": "Data saham tidak ditemukan."}), 404
    return jsonify({"success": True, "data": stock.to_dict()}), 200


# ============================================================
# ROUTE 3: ringkasan pasar (indeks IHSG dll)
# ============================================================
@stocks_bp.route("/market-overview", methods=["GET"])
def get_market_overview():
    data = YFinanceHelper.get_market_overview()  # ambil dari yfinance
    if not data:  # gagal -> 502
        return jsonify({"success": False, "message": "Gagal mengambil ringkasan pasar dari yfinance."}), 502
    return jsonify({"success": True, "data": data}), 200


# ============================================================
# ROUTE 4: detail lengkap (profile + fundamental + chart)
# ============================================================
@stocks_bp.route("/stocks/<string:ticker>/detail", methods=["GET"])
def get_stock_detail_full(ticker):
    try:
        timeframe = request.args.get("timeframe", "1D").strip().upper()  # ambil timeframe
        if timeframe not in PUBLIC_TIMEFRAMES:  # validasi
            timeframe = "1D"  # default aman

        stock = Stock.query.filter_by(ticker=ticker.upper()).first()  # dari DB
        stock_payload = _build_virtual_stock(ticker, stock=stock)  # payload data stock
        # profil & fundamental dari DB kalau ada
        profile = StockProfile.query.filter_by(stock_id=stock.id).first() if stock else None
        fundamental = StockFundamental.query.filter_by(stock_id=stock.id).first() if stock else None

        # ambil profil live dari yfinance (lebih fresh)
        live_profile = YFinanceHelper.get_stock_info(ticker, translate_summary=True) or {}
        summary_id = ""
        # terjemahin summary bahasa Inggris -> Indonesia
        if live_profile.get("longBusinessSummary"):
            summary_id = TextHelper.translate_to_indonesian(live_profile.get("longBusinessSummary", ""))
        elif profile and profile.long_business_summary:
            summary_id = TextHelper.translate_to_indonesian(profile.long_business_summary)

        profile_data = profile.to_dict() if profile else {}  # dari DB kalau ada
        # merge: priority live > DB > fallback string
        profile_data = {
            **profile_data,
            "longName": live_profile.get("longName") or profile_data.get("longName") or stock_payload.get("name") or ticker.upper(),
            "shortName": live_profile.get("shortName") or profile_data.get("shortName") or stock_payload.get("name") or ticker.upper(),
            "sector": live_profile.get("sector") or profile_data.get("sector") or stock_payload.get("sector") or "-",
            "industry": live_profile.get("industry") or profile_data.get("industry") or "-",
            "website": live_profile.get("website") or profile_data.get("website") or "",
            "city": live_profile.get("city") or profile_data.get("city") or "",
            "country": live_profile.get("country") or profile_data.get("country") or "",
            "longBusinessSummary": summary_id or profile_data.get("longBusinessSummary") or "Deskripsi perusahaan belum tersedia dalam Bahasa Indonesia.",
            "language": "id",
            "source": "yfinance",
        }

        chart = []  # placeholder candle
        # metadata chart (asal data, tanggal, dll)
        chart_meta = {
            "source": "database" if stock else "yfinance",
            "latestDate": stock.updated_at.strftime("%Y-%m-%d") if stock and stock.updated_at else stock_payload.get("lastUpdated", "")[:10] or None,
            "latestUpdated": stock.to_dict().get("lastUpdated") if stock else stock_payload.get("lastUpdated"),
            "interval": "1d",
            "note": "Data historis dari database internal." if stock else "Data harga terbaru diambil dari yfinance.",
        }

        # timeframe 1D pake intraday (per jam)
        if timeframe == "1D":
            intraday = YFinanceHelper.get_intraday_ohlc(ticker, interval="60m", period="5d")
            if intraday.get("candles"):  # ada data?
                chart = intraday.get("candles", [])  # override chart
                chart_meta = {
                    "source": "yfinance",
                    "latestDate": intraday.get("last_date"),
                    "latestUpdated": intraday.get("last_updated"),
                    "interval": "60m",
                    "note": "Grafik 1D memakai OHLC intraday terbaru per jam dari hari perdagangan terakhir yang tersedia di yfinance.",
                }

        # fallback: ambil history dari DB kalau yfinance kosong
        if not chart and stock:
            histories = (
                StockPriceHistory.query
                .filter_by(stock_id=stock.id, timeframe=("1D" if timeframe == "1D" else timeframe))
                .order_by(StockPriceHistory.sort_order.asc(), StockPriceHistory.id.asc())
                .all()
            )
            histories = _sanitize_daily_histories(histories)  # buang yang rusak
            chart = [item.to_dict() for item in histories]  # serialize

        # kirim response final
        return jsonify({
            "success": True,
            "data": {
                "stock": stock_payload,
                "profile": profile_data,
                "fundamental": fundamental.to_dict() if fundamental else None,
                "chart": chart,
                "timeframe": timeframe,
                "chartMeta": chart_meta,
            }
        }), 200
    except Exception as e:  # error tak terduga
        # catat ke log
        log_external_service("Stock Detail", f"Detail saham gagal untuk {ticker.upper()}", details=str(e), user_id=None, ip_address=_request_ip())
        return jsonify({"success": False, "message": "Terjadi kesalahan saat mengambil detail saham."}), 500


# ============================================================
# ROUTE 5: data candlestick (grafik)
# ============================================================
@stocks_bp.route("/stocks/<string:ticker>/candlestick", methods=["GET"])
def get_candlestick_data(ticker):
    try:
        stock = Stock.query.filter_by(ticker=ticker.upper()).first()  # cek DB
        timeframe = request.args.get("timeframe", "1D").strip().upper()  # ambil timeframe
        if timeframe not in PUBLIC_TIMEFRAMES:  # validasi
            timeframe = "1D"

        if timeframe == "1D":  # 1 hari -> intraday
            intraday = YFinanceHelper.get_intraday_ohlc(ticker, interval="60m", period="5d")
            if intraday.get("candles"):
                return jsonify({
                    "success": True,
                    "data": intraday.get("candles", []),
                    "timeframe": "1D",
                    "realtime": False,  # bukan realtime beneran
                    "source": "yfinance",
                    "latestDate": intraday.get("last_date"),
                    "latestUpdated": intraday.get("last_updated"),
                    "interval": "60m",
                    "note": "Bukan harga realtime. Grafik ini hanya visualisasi data historis dari yfinance, bukan harga prediksi.",
                }), 200
        else:  # 7D atau 1M -> daily
            historical = YFinanceHelper.get_range_ohlc(ticker, timeframe=timeframe)
            if historical.get("candles"):
                return jsonify({
                    "success": True,
                    "data": historical.get("candles", []),
                    "timeframe": timeframe,
                    "realtime": False,
                    "source": "yfinance",
                    "latestDate": historical.get("last_date"),
                    "latestUpdated": historical.get("last_updated"),
                    "interval": historical.get("interval") or "1d",
                    "note": "Bukan harga realtime. Grafik ini hanya visualisasi data historis dari yfinance, bukan harga prediksi.",
                }), 200

        # fallback kalau nggak ada di DB juga
        if not stock:
            quote = YFinanceHelper.get_latest_quote(ticker)
            return jsonify({
                "success": True,
                "data": [],  # kosong
                "timeframe": timeframe,
                "realtime": False,
                "source": "yfinance",
                "latestDate": quote.get("date"),
                "latestUpdated": quote.get("updatedAt"),
                "interval": "60m" if timeframe == "1D" else "1d",
                "note": "Bukan harga realtime. Grafik ini hanya visualisasi data historis dari yfinance, bukan harga prediksi.",
            }), 200

        # last resort: ambil dari DB internal
        histories = (
            StockPriceHistory.query
            .filter_by(stock_id=stock.id, timeframe=timeframe)
            .order_by(StockPriceHistory.sort_order.asc(), StockPriceHistory.id.asc())
            .all()
        )

        histories = _sanitize_daily_histories(histories)  # bersihin
        # convert ke format candle yang dipakai frontend
        candlestick_data = [{
            "t": history.label,
            "open": history.open_price,
            "high": history.high_price,
            "low": history.low_price,
            "close": history.close_price,
        } for history in histories]

        return jsonify({
            "success": True,
            "data": candlestick_data,
            "timeframe": timeframe,
            "realtime": False,
            "source": "database",
            "latestDate": stock.updated_at.strftime("%Y-%m-%d") if stock.updated_at else None,
            "latestUpdated": stock.to_dict().get("lastUpdated"),
            "interval": "1d",
        }), 200
    except Exception as e:
        log_external_service("Candlestick", f"Candlestick gagal untuk {ticker.upper()}", details=str(e), user_id=None, ip_address=_request_ip())
        return jsonify({"success": False, "message": "Terjadi kesalahan saat mengambil data candlestick."}), 500


# ============================================================
# ROUTE 6: prediksi AI (harga besok + fundamental 3 bulan)
# ============================================================
@stocks_bp.route("/stocks/<string:ticker>/prediction", methods=["GET"])
def get_stock_prediction(ticker):
    stock = Stock.query.filter_by(ticker=ticker.upper()).first()  # cek ada di DB
    ip_address = _request_ip()  # IP buat log
    if not stock:  # saham nggak ada
        log_prediction(ticker.upper(), False, "Data saham tidak ditemukan.", ip_address=ip_address)
        return jsonify({"success": False, "message": "Data saham tidak ditemukan."}), 404

    try:
        # panggil ML predictor — pake suffix .JK buat Bursa Indonesia
        result = predict_stock_price(f"{ticker.upper()}.JK")
        if not result:  # model gagal
            log_prediction(ticker.upper(), False, "Model gagal menghasilkan prediksi.", ip_address=ip_address)
            return jsonify({"success": False, "message": "Prediksi gagal dijalankan."}), 500

        # log sukses + MAPE
        log_prediction(ticker.upper(), True, mape=result.get("mape"), ip_address=ip_address)
        return jsonify({"success": True, "data": result}), 200
    except Exception as e:  # error internal
        log_external_service("ML Prediction", f"Prediksi gagal untuk {ticker.upper()}", details=str(e), user_id=None, ip_address=ip_address)
        return jsonify({"success": False, "message": "Terjadi kesalahan saat menjalankan prediksi."}), 500


# ============================================================
# ROUTE 7: data fundamental detail (rasio + raw data)
# ============================================================
@stocks_bp.route("/stocks/<string:ticker>/fundamentals", methods=["GET"])
def get_stock_fundamentals(ticker):
    stock = Stock.query.filter_by(ticker=ticker.upper()).first()  # cek DB
    if not stock:
        return jsonify({"success": False, "message": "Data saham tidak ditemukan."}), 404

    # ambil fundamental fresh dari yfinance
    fundamentals = YFinanceHelper.get_fundamentals(f"{ticker.upper()}.JK")
    # ambil juga yang di DB (buat fallback / cache)
    stored = StockFundamental.query.filter_by(stock_id=stock.id).first()

    # ambil profil juga (sekali query aja biar hemat)
    profile_row = StockProfile.query.filter_by(stock_id=stock.id).first()

    return jsonify({
        "success": True,
        "data": {
            "profile": profile_row.to_dict() if profile_row else None,  # profile optional
            "fundamentals": {
                "ratios": {  # rasio kunci
                    "eps": fundamentals.get("eps"),
                    "pbv": fundamentals.get("pbv"),
                    "roe": fundamentals.get("roe"),
                    "pe": fundamentals.get("pe"),
                    # nambahin debt-to-equity dll bisa di sini kalau perlu
                },
                "rawData": fundamentals.get("rawData", {}),  # data mentah
            },
            "storedFundamental": stored.to_dict() if stored else None,  # cache DB
        }
    }), 200
