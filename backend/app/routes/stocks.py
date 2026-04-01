from flask import Blueprint, request, jsonify, g
from app import db
from app.models import Stock, StockProfile, StockFundamental, StockPriceHistory
from app.utils.logger import log_prediction, log_stock_crud, log_external_service
from app.utils.auth_decorators import token_required, role_required
from app.utils.ml_predictor import predict_stock_price
from app.utils.yfinance_helper import YFinanceHelper
from app.utils.text_helper import TextHelper

stocks_bp = Blueprint("stocks_bp", __name__)

PUBLIC_TIMEFRAMES = {"1D", "7D", "1M"}


def _request_ip():
    return request.headers.get("X-Forwarded-For", request.remote_addr)


def _sanitize_daily_histories(histories):
    cleaned = []
    for item in histories:
        if not item.label:
            continue
        cleaned.append(item)
    return cleaned


def _build_virtual_stock(ticker, stock=None):
    quote = YFinanceHelper.get_latest_quote(ticker)
    info = YFinanceHelper.get_stock_info(ticker, translate_summary=False)
    if stock:
        return stock.to_dict()
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


@stocks_bp.route("/stocks", methods=["GET"])
def get_stocks():
    search = request.args.get("search", "").strip()
    status = request.args.get("status", "").strip()
    query = Stock.query

    if search:
        keyword = f"%{search}%"
        query = query.filter(
            db.or_(
                Stock.ticker.ilike(keyword),
                Stock.name.ilike(keyword),
                Stock.sector.ilike(keyword)
            )
        )

    if status:
        query = query.filter(Stock.status == status)

    items = query.order_by(Stock.ticker.asc()).all()
    return jsonify({"success": True, "data": [item.to_dict() for item in items]}), 200


@stocks_bp.route("/stocks/<string:ticker>", methods=["GET"])
def get_stock_detail(ticker):
    stock = Stock.query.filter_by(ticker=ticker.upper()).first()
    if not stock:
        return jsonify({"success": False, "message": "Data saham tidak ditemukan."}), 404
    return jsonify({"success": True, "data": stock.to_dict()}), 200


@stocks_bp.route("/admin/stocks", methods=["POST"])
@token_required
@role_required("admin")
def create_stock():
    data = request.get_json() or {}
    ip_address = _request_ip()

    ticker = (data.get("ticker") or "").strip().upper()
    name = (data.get("name") or "").strip()
    sector = (data.get("sector") or "").strip()
    price = data.get("price", 0)
    change_percent = (data.get("change") or data.get("change_percent") or "0.00%").strip()
    status = (data.get("status") or "Active").strip()

    if not ticker:
        return jsonify({"success": False, "message": "Ticker wajib diisi."}), 400
    if not name:
        return jsonify({"success": False, "message": "Nama perusahaan wajib diisi."}), 400
    if not sector:
        return jsonify({"success": False, "message": "Sektor wajib diisi."}), 400

    existing = Stock.query.filter_by(ticker=ticker).first()
    if existing:
        return jsonify({"success": False, "message": "Ticker saham sudah ada."}), 409

    stock = Stock(
        ticker=ticker,
        name=name,
        sector=sector,
        price=price or 0,
        change_percent=change_percent,
        status=status or "Active"
    )

    db.session.add(stock)
    db.session.commit()
    log_stock_crud("CREATE", stock.id, ticker, user_id=g.current_user.get("id"), ip_address=ip_address)
    return jsonify({"success": True, "message": "Data saham berhasil ditambahkan.", "data": stock.to_dict()}), 201


@stocks_bp.route("/admin/stocks/<int:stock_id>", methods=["PUT"])
@token_required
@role_required("admin")
def update_stock(stock_id):
    ip_address = _request_ip()
    stock = Stock.query.get(stock_id)
    if not stock:
        return jsonify({"success": False, "message": "Data saham tidak ditemukan."}), 404

    data = request.get_json() or {}
    ticker = (data.get("ticker") or "").strip().upper()
    name = (data.get("name") or "").strip()
    sector = (data.get("sector") or "").strip()
    price = data.get("price", 0)
    change_percent = (data.get("change") or data.get("change_percent") or "0.00%").strip()
    status = (data.get("status") or "Active").strip()

    if not ticker or not name or not sector:
        return jsonify({"success": False, "message": "Ticker, nama perusahaan, dan sektor wajib diisi."}), 400

    existing = Stock.query.filter(Stock.ticker == ticker, Stock.id != stock_id).first()
    if existing:
        return jsonify({"success": False, "message": "Ticker saham sudah digunakan data lain."}), 409

    stock.ticker = ticker
    stock.name = name
    stock.sector = sector
    stock.price = price or 0
    stock.change_percent = change_percent
    stock.status = status or "Active"
    db.session.commit()
    log_stock_crud("UPDATE", stock.id, ticker, user_id=g.current_user.get("id"), ip_address=ip_address)
    return jsonify({"success": True, "message": "Data saham berhasil diperbarui.", "data": stock.to_dict()}), 200


@stocks_bp.route("/admin/stocks/<int:stock_id>", methods=["DELETE"])
@token_required
@role_required("admin")
def delete_stock(stock_id):
    ip_address = _request_ip()
    stock = Stock.query.get(stock_id)
    if not stock:
        return jsonify({"success": False, "message": "Data saham tidak ditemukan."}), 404

    ticker = stock.ticker
    db.session.delete(stock)
    db.session.commit()
    log_stock_crud("DELETE", stock_id, ticker, user_id=g.current_user.get("id"), ip_address=ip_address)
    return jsonify({"success": True, "message": "Data saham berhasil dihapus."}), 200


@stocks_bp.route("/market-overview", methods=["GET"])
def get_market_overview():
    data = YFinanceHelper.get_market_overview()
    if not data:
        return jsonify({"success": False, "message": "Gagal mengambil ringkasan pasar dari yfinance."}), 502
    return jsonify({"success": True, "data": data}), 200


@stocks_bp.route("/stocks/<string:ticker>/detail", methods=["GET"])
def get_stock_detail_full(ticker):
    try:
        timeframe = request.args.get("timeframe", "1D").strip().upper()
        if timeframe not in PUBLIC_TIMEFRAMES:
            timeframe = "1D"

        stock = Stock.query.filter_by(ticker=ticker.upper()).first()
        stock_payload = _build_virtual_stock(ticker, stock=stock)
        profile = StockProfile.query.filter_by(stock_id=stock.id).first() if stock else None
        fundamental = StockFundamental.query.filter_by(stock_id=stock.id).first() if stock else None

        live_profile = YFinanceHelper.get_stock_info(ticker, translate_summary=True) or {}
        summary_id = ""
        if live_profile.get("longBusinessSummary"):
            summary_id = TextHelper.translate_to_indonesian(live_profile.get("longBusinessSummary", ""))
        elif profile and profile.long_business_summary:
            summary_id = TextHelper.translate_to_indonesian(profile.long_business_summary)

        profile_data = profile.to_dict() if profile else {}
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

        chart = []
        chart_meta = {
            "source": "database" if stock else "yfinance",
            "latestDate": stock.updated_at.strftime("%Y-%m-%d") if stock and stock.updated_at else stock_payload.get("lastUpdated", "")[:10] or None,
            "latestUpdated": stock.to_dict().get("lastUpdated") if stock else stock_payload.get("lastUpdated"),
            "interval": "1d",
            "note": "Data historis dari database internal." if stock else "Data harga terbaru diambil dari yfinance.",
        }
        if timeframe == "1D":
            intraday = YFinanceHelper.get_intraday_ohlc(ticker, interval="60m", period="5d")
            if intraday.get("candles"):
                chart = intraday.get("candles", [])
                chart_meta = {
                    "source": "yfinance",
                    "latestDate": intraday.get("last_date"),
                    "latestUpdated": intraday.get("last_updated"),
                    "interval": "60m",
                    "note": "Grafik 1D memakai OHLC intraday terbaru per jam dari hari perdagangan terakhir yang tersedia di yfinance.",
                }

        if not chart and stock:
            histories = (
                StockPriceHistory.query
                .filter_by(stock_id=stock.id, timeframe=("1D" if timeframe == "1D" else timeframe))
                .order_by(StockPriceHistory.sort_order.asc(), StockPriceHistory.id.asc())
                .all()
            )
            histories = _sanitize_daily_histories(histories)
            chart = [item.to_dict() for item in histories]

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
    except Exception as e:
        log_external_service("Stock Detail", f"Detail saham gagal untuk {ticker.upper()}", details=str(e), user_id=None, ip_address=_request_ip())
        return jsonify({"success": False, "message": "Terjadi kesalahan saat mengambil detail saham."}), 500


@stocks_bp.route("/stocks/<string:ticker>/candlestick", methods=["GET"])
def get_candlestick_data(ticker):
    try:
        stock = Stock.query.filter_by(ticker=ticker.upper()).first()
        timeframe = request.args.get("timeframe", "1D").strip().upper()
        if timeframe not in PUBLIC_TIMEFRAMES:
            timeframe = "1D"

        if timeframe == "1D":
            intraday = YFinanceHelper.get_intraday_ohlc(ticker, interval="60m", period="5d")
            if intraday.get("candles"):
                return jsonify({
                    "success": True,
                    "data": intraday.get("candles", []),
                    "timeframe": "1D",
                    "realtime": False,
                    "source": "yfinance",
                    "latestDate": intraday.get("last_date"),
                    "latestUpdated": intraday.get("last_updated"),
                    "interval": "60m",
                    "note": "Bukan harga realtime. Grafik ini hanya visualisasi data historis dari yfinance, bukan harga prediksi.",
                }), 200
        else:
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

        if not stock:
            quote = YFinanceHelper.get_latest_quote(ticker)
            return jsonify({
                "success": True,
                "data": [],
                "timeframe": timeframe,
                "realtime": False,
                "source": "yfinance",
                "latestDate": quote.get("date"),
                "latestUpdated": quote.get("updatedAt"),
                "interval": "60m" if timeframe == "1D" else "1d",
                "note": "Bukan harga realtime. Grafik ini hanya visualisasi data historis dari yfinance, bukan harga prediksi.",
            }), 200

        histories = (
            StockPriceHistory.query
            .filter_by(stock_id=stock.id, timeframe=timeframe)
            .order_by(StockPriceHistory.sort_order.asc(), StockPriceHistory.id.asc())
            .all()
        )

        histories = _sanitize_daily_histories(histories)
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


@stocks_bp.route("/stocks/<string:ticker>/prediction", methods=["GET"])
def get_stock_prediction(ticker):
    stock = Stock.query.filter_by(ticker=ticker.upper()).first()
    ip_address = _request_ip()
    if not stock:
        log_prediction(ticker.upper(), False, "Data saham tidak ditemukan.", ip_address=ip_address)
        return jsonify({"success": False, "message": "Data saham tidak ditemukan."}), 404

    try:
        result = predict_stock_price(f"{ticker.upper()}.JK")
        if not result:
            log_prediction(ticker.upper(), False, "Model gagal menghasilkan prediksi.", ip_address=ip_address)
            return jsonify({"success": False, "message": "Prediksi gagal dijalankan."}), 500

        log_prediction(ticker.upper(), True, rmse=result.get("rmse"), ip_address=ip_address)
        return jsonify({"success": True, "data": result}), 200
    except Exception as e:
        log_external_service("ML Prediction", f"Prediksi gagal untuk {ticker.upper()}", details=str(e), user_id=None, ip_address=ip_address)
        return jsonify({"success": False, "message": "Terjadi kesalahan saat menjalankan prediksi."}), 500

@stocks_bp.route("/stocks/<string:ticker>/fundamentals", methods=["GET"])
def get_stock_fundamentals(ticker):
    stock = Stock.query.filter_by(ticker=ticker.upper()).first()
    if not stock:
        return jsonify({"success": False, "message": "Data saham tidak ditemukan."}), 404

    fundamentals = YFinanceHelper.get_fundamentals(f"{ticker.upper()}.JK")
    stored = StockFundamental.query.filter_by(stock_id=stock.id).first()

    return jsonify({
        "success": True,
        "data": {
            "profile": StockProfile.query.filter_by(stock_id=stock.id).first().to_dict() if StockProfile.query.filter_by(stock_id=stock.id).first() else None,
            "fundamentals": {
                "ratios": {
                    "eps": fundamentals.get("eps"),
                    "pbv": fundamentals.get("pbv"),
                    "roe": fundamentals.get("roe"),
                    "pe": fundamentals.get("pe"),
                },
                "rawData": fundamentals.get("rawData", {}),
            },
            "storedFundamental": stored.to_dict() if stored else None,
        }
    }), 200
