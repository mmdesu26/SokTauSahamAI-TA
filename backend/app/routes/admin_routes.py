from flask import Blueprint, jsonify, g, request
from app.utils.auth_decorators import token_required, role_required
from app import db
from app.models import Stock, StockProfile, StockFundamental, StockPriceHistory, SystemLog
from app.utils.yfinance_helper import YFinanceHelper
from app.utils.logger import log_stock_crud, log_external_service, SystemLogger
import logging

logger = logging.getLogger(__name__)
admin_bp = Blueprint("admin_bp", __name__)


def _user_id():
    return getattr(g, "current_user", {}).get("id")


def _ip_address():
    return request.headers.get("X-Forwarded-For", request.remote_addr)


def _save_daily_ohlc(stock_id, ticker_yf):
    ohlc_data = YFinanceHelper.get_ohlc_data(ticker_yf, days=252, exclude_today=True)
    StockPriceHistory.query.filter_by(stock_id=stock_id).delete()
    for i, candle in enumerate(ohlc_data):
        db.session.add(StockPriceHistory(
            stock_id=stock_id,
            timeframe="1D",
            label=candle["date"],
            open_price=candle["open"],
            high_price=candle["high"],
            low_price=candle["low"],
            close_price=candle["close"],
            sort_order=i,
        ))
    return ohlc_data


@admin_bp.route("/dashboard", methods=["GET"])
@token_required
@role_required("admin")
def admin_dashboard():
    return jsonify({"success": True, "message": "Selamat datang di dashboard admin.", "user": g.current_user}), 200


@admin_bp.route("/stocks", methods=["GET"])
@token_required
@role_required("admin")
def get_all_stocks():
    try:
        stocks = Stock.query.all()
        return jsonify({"success": True, "data": [stock.to_dict() for stock in stocks]}), 200
    except Exception as e:
        logger.error(f"Error fetching stocks: {str(e)}")
        SystemLogger.error("Stock Management", "Gagal mengambil daftar saham", details=str(e), user_id=_user_id(), ip_address=_ip_address())
        return jsonify({"success": False, "message": str(e)}), 500


@admin_bp.route("/stocks", methods=["POST"])
@token_required
@role_required("admin")
def create_stock():
    try:
        data = request.get_json() or {}
        ticker_input = (data.get("ticker") or "").strip().upper()
        status = (data.get("status") or "Active").strip()

        if not ticker_input:
            return jsonify({"success": False, "message": "Ticker wajib diisi"}), 400

        ticker_yf = ticker_input if ticker_input.endswith(".JK") else f"{ticker_input}.JK"
        ticker_code = ticker_input.replace(".JK", "")

        if Stock.query.filter_by(ticker=ticker_code).first():
            return jsonify({"success": False, "message": f"Saham {ticker_code} sudah ada"}), 409

        info = YFinanceHelper.get_stock_info(ticker_yf, translate_summary=True)
        fundamentals = YFinanceHelper.get_fundamentals(ticker_yf)
        if not info or not info.get("longName"):
            log_external_service("yfinance", f"Ticker {ticker_code} tidak ditemukan di yfinance", success=False, user_id=_user_id(), ip_address=_ip_address())
            return jsonify({"success": False, "message": f"Ticker {ticker_code} tidak ditemukan di yfinance"}), 404

        stock = Stock(
            ticker=ticker_code,
            name=info.get("longName", ticker_code),
            sector=info.get("sector", "Unknown"),
            price=float(fundamentals.get("rawData", {}).get("currentPrice", 0) or 0),
            status=status,
        )
        db.session.add(stock)
        db.session.flush()

        profile = StockProfile(
            stock_id=stock.id,
            long_name=info.get("longName", ""),
            short_name=info.get("shortName", ""),
            sector=info.get("sector", ""),
            industry=info.get("industry", ""),
            website=info.get("website", ""),
            city=info.get("city", ""),
            country=info.get("country", ""),
            long_business_summary=info.get("longBusinessSummary", ""),
        )
        db.session.add(profile)

        fundamental = StockFundamental(stock_id=stock.id)
        fundamental.eps_ttm = fundamentals.get("eps")
        fundamental.pbv = fundamentals.get("pbv")
        fundamental.roe = fundamentals.get("roe")
        fundamental.per_ttm = fundamentals.get("pe")
        raw = fundamentals.get("rawData", {})
        fundamental.revenue = raw.get("revenue")
        fundamental.net_income = raw.get("netIncome")
        fundamental.total_assets = raw.get("totalAssets")
        fundamental.total_equity = raw.get("totalEquity")
        db.session.add(fundamental)

        ohlc_data = _save_daily_ohlc(stock.id, ticker_yf)
        if ohlc_data:
            stock.price = ohlc_data[-1]["close"]

        db.session.commit()
        log_stock_crud("CREATE", stock.id, ticker_code, user_id=_user_id(), ip_address=_ip_address())

        return jsonify({"success": True, "message": f"Saham {ticker_code} berhasil ditambahkan", "data": stock.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating stock: {str(e)}")
        log_stock_crud("CREATE", None, (request.get_json() or {}).get("ticker", "UNKNOWN"), user_id=_user_id(), error=str(e), ip_address=_ip_address())
        return jsonify({"success": False, "message": str(e)}), 500


@admin_bp.route("/stocks/<int:stock_id>", methods=["PUT"])
@token_required
@role_required("admin")
def update_stock(stock_id):
    try:
        stock = Stock.query.get(stock_id)
        if not stock:
            return jsonify({"success": False, "message": "Saham tidak ditemukan"}), 404

        data = request.get_json() or {}
        if "status" in data:
            stock.status = (data.get("status") or stock.status).strip()

        db.session.commit()
        log_stock_crud("UPDATE", stock.id, stock.ticker, user_id=_user_id(), ip_address=_ip_address())
        return jsonify({"success": True, "message": f"Saham {stock.ticker} berhasil diperbarui", "data": stock.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating stock: {str(e)}")
        log_stock_crud("UPDATE", stock_id, "UNKNOWN", user_id=_user_id(), error=str(e), ip_address=_ip_address())
        return jsonify({"success": False, "message": str(e)}), 500


@admin_bp.route("/stocks/search", methods=["GET"])
@token_required
@role_required("admin")
def search_stocks():
    try:
        query = request.args.get("q", "").strip()
        if not query:
            return jsonify({"success": True, "data": []}), 200
        results = YFinanceHelper.search_stocks(query)
        return jsonify({"success": True, "data": results}), 200
    except Exception as e:
        logger.error(f"Error searching stocks: {str(e)}")
        SystemLogger.error("Stock Management", "Gagal mencari saham", details=str(e), user_id=_user_id(), ip_address=_ip_address())
        return jsonify({"success": False, "message": str(e)}), 500


@admin_bp.route("/logs", methods=["GET"])
@token_required
@role_required("admin")
def get_logs():
    try:
        level = request.args.get("level", "all").strip().lower()
        source = request.args.get("source", "").strip().lower()
        limit = int(request.args.get("limit", 100))
        offset = int(request.args.get("offset", 0))

        query = SystemLog.query
        if level != "all":
            query = query.filter_by(level=level)
        if source:
            query = query.filter(SystemLog.source.ilike(f"%{source}%"))

        total = query.count()
        logs = query.order_by(SystemLog.timestamp.desc()).offset(offset).limit(limit).all()
        return jsonify({
            "success": True,
            "data": [log.to_dict() for log in logs],
            "total": total,
            "offset": offset,
            "limit": limit,
        }), 200
    except Exception as e:
        logger.error(f"Error fetching logs: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


@admin_bp.route("/stocks/<int:stock_id>", methods=["DELETE"])
@token_required
@role_required("admin")
def delete_stock(stock_id):
    try:
        stock = Stock.query.get(stock_id)
        if not stock:
            return jsonify({"success": False, "message": "Saham tidak ditemukan"}), 404

        ticker = stock.ticker
        StockPriceHistory.query.filter_by(stock_id=stock_id).delete()
        StockFundamental.query.filter_by(stock_id=stock_id).delete()
        StockProfile.query.filter_by(stock_id=stock_id).delete()
        db.session.delete(stock)
        db.session.commit()

        log_stock_crud("DELETE", stock_id, ticker, user_id=_user_id(), ip_address=_ip_address())
        return jsonify({"success": True, "message": f"Saham {ticker} berhasil dihapus"}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting stock: {str(e)}")
        log_stock_crud("DELETE", stock_id, "UNKNOWN", user_id=_user_id(), error=str(e), ip_address=_ip_address())
        return jsonify({"success": False, "message": str(e)}), 500


@admin_bp.route("/sync-stocks", methods=["POST"])
@token_required
@role_required("admin")
def sync_stocks_data():
    try:
        stocks_to_sync = [
            ("BBCA.JK", "BBCA"), ("BBRI.JK", "BBRI"), ("BMRI.JK", "BMRI"),
            ("BRPT.JK", "BRPT"), ("HUMI.JK", "HUMI")
        ]
        synced_stocks = []

        for ticker_yf, ticker_code in stocks_to_sync:
            try:
                stock = Stock.query.filter_by(ticker=ticker_code).first()
                if not stock:
                    info = YFinanceHelper.get_stock_info(ticker_yf, translate_summary=True)
                    stock = Stock(
                        ticker=ticker_code,
                        name=info.get("longName", ticker_code),
                        sector=info.get("sector", "Unknown"),
                        price=0,
                        status="Active",
                    )
                    db.session.add(stock)
                    db.session.flush()

                info = YFinanceHelper.get_stock_info(ticker_yf, translate_summary=True)
                profile = StockProfile.query.filter_by(stock_id=stock.id).first() or StockProfile(stock_id=stock.id)
                if not getattr(profile, "id", None):
                    db.session.add(profile)
                profile.long_name = info.get("longName", "")
                profile.short_name = info.get("shortName", "")
                profile.sector = info.get("sector", "")
                profile.industry = info.get("industry", "")
                profile.website = info.get("website", "")
                profile.city = info.get("city", "")
                profile.country = info.get("country", "")
                profile.long_business_summary = info.get("longBusinessSummary", "")

                fundamentals = YFinanceHelper.get_fundamentals(ticker_yf)
                fundamental = StockFundamental.query.filter_by(stock_id=stock.id).first() or StockFundamental(stock_id=stock.id)
                if not getattr(fundamental, "id", None):
                    db.session.add(fundamental)
                fundamental.eps_ttm = fundamentals.get("eps")
                fundamental.pbv = fundamentals.get("pbv")
                fundamental.roe = fundamentals.get("roe")
                fundamental.per_ttm = fundamentals.get("pe")
                raw = fundamentals.get("rawData", {})
                fundamental.revenue = raw.get("revenue")
                fundamental.net_income = raw.get("netIncome")
                fundamental.total_assets = raw.get("totalAssets")
                fundamental.total_equity = raw.get("totalEquity")

                ohlc_data = _save_daily_ohlc(stock.id, ticker_yf)
                if ohlc_data:
                    stock.price = ohlc_data[-1]["close"]
                synced_stocks.append(ticker_code)
                SystemLogger.success("Stock Sync", f"Sinkronisasi berhasil untuk {ticker_code}", user_id=_user_id(), entity_type="Stock", entity_id=stock.id, ip_address=_ip_address())
            except Exception as e:
                logger.error(f"Error syncing {ticker_code}: {e}")
                SystemLogger.error("Stock Sync", f"Sinkronisasi gagal untuk {ticker_code}", details=str(e), user_id=_user_id(), entity_type="Stock", ip_address=_ip_address())
                continue

        db.session.commit()
        return jsonify({"success": True, "message": f"Sinkronisasi berhasil untuk {len(synced_stocks)} saham", "synced_stocks": synced_stocks}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Sync error: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500
