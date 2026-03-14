from flask import Blueprint, request, jsonify
from app import db
from app.models import Stock, StockProfile, StockFundamental, StockPriceHistory

stocks_bp = Blueprint("stocks_bp", __name__)

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

    return jsonify({
        "success": True,
        "data": [item.to_dict() for item in items]
    }), 200

@stocks_bp.route("/stocks/<string:ticker>", methods=["GET"])
def get_stock_detail(ticker):
    stock = Stock.query.filter_by(ticker=ticker.upper()).first()

    if not stock:
        return jsonify({
            "success": False,
            "message": "Data saham tidak ditemukan."
        }), 404

    return jsonify({
        "success": True,
        "data": stock.to_dict()
    }), 200

@stocks_bp.route("/admin/stocks", methods=["POST"])
def create_stock():
    data = request.get_json() or {}

    ticker = (data.get("ticker") or "").strip().upper()
    name = (data.get("name") or "").strip()
    sector = (data.get("sector") or "").strip()
    price = data.get("price", 0)
    change_percent = (data.get("change") or data.get("change_percent") or "0.00%").strip()
    volume = (data.get("volume") or "0").strip()
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
        volume=volume,
        status=status or "Active"
    )

    db.session.add(stock)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Data saham berhasil ditambahkan.",
        "data": stock.to_dict()
    }), 201

@stocks_bp.route("/admin/stocks/<int:stock_id>", methods=["PUT"])
def update_stock(stock_id):
    stock = Stock.query.get(stock_id)

    if not stock:
        return jsonify({
            "success": False,
            "message": "Data saham tidak ditemukan."
        }), 404

    data = request.get_json() or {}

    ticker = (data.get("ticker") or "").strip().upper()
    name = (data.get("name") or "").strip()
    sector = (data.get("sector") or "").strip()
    price = data.get("price", 0)
    change_percent = (data.get("change") or data.get("change_percent") or "0.00%").strip()
    volume = (data.get("volume") or "0").strip()
    status = (data.get("status") or "Active").strip()

    if not ticker:
        return jsonify({"success": False, "message": "Ticker wajib diisi."}), 400
    if not name:
        return jsonify({"success": False, "message": "Nama perusahaan wajib diisi."}), 400
    if not sector:
        return jsonify({"success": False, "message": "Sektor wajib diisi."}), 400

    existing = Stock.query.filter(
        Stock.ticker == ticker,
        Stock.id != stock_id
    ).first()

    if existing:
        return jsonify({"success": False, "message": "Ticker saham sudah digunakan data lain."}), 409

    stock.ticker = ticker
    stock.name = name
    stock.sector = sector
    stock.price = price or 0
    stock.change_percent = change_percent
    stock.volume = volume
    stock.status = status or "Active"

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Data saham berhasil diperbarui.",
        "data": stock.to_dict()
    }), 200

@stocks_bp.route("/admin/stocks/<int:stock_id>", methods=["DELETE"])
def delete_stock(stock_id):
    stock = Stock.query.get(stock_id)

    if not stock:
        return jsonify({
            "success": False,
            "message": "Data saham tidak ditemukan."
        }), 404

    db.session.delete(stock)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Data saham berhasil dihapus."
    }), 200

@stocks_bp.route("/stocks/<string:ticker>/detail", methods=["GET"])
def get_stock_detail_full(ticker):
    timeframe = request.args.get("timeframe", "1D").strip().upper()

    stock = Stock.query.filter_by(ticker=ticker.upper()).first()

    if not stock:
        return jsonify({
            "success": False,
            "message": "Data saham tidak ditemukan."
        }), 404

    profile = StockProfile.query.filter_by(stock_id=stock.id).first()
    fundamental = StockFundamental.query.filter_by(stock_id=stock.id).first()

    histories = (
        StockPriceHistory.query
        .filter_by(stock_id=stock.id, timeframe=timeframe)
        .order_by(StockPriceHistory.sort_order.asc(), StockPriceHistory.id.asc())
        .all()
    )

    return jsonify({
        "success": True,
        "data": {
            "stock": stock.to_dict(),
            "profile": profile.to_dict() if profile else None,
            "fundamental": fundamental.to_dict() if fundamental else None,
            "chart": [item.to_dict() for item in histories],
            "timeframe": timeframe,
        }
    }), 200