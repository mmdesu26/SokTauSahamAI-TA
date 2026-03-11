from flask import Blueprint, jsonify, abort, request
from app import limiter

investor_bp = Blueprint("investor_bp", __name__)

@investor_bp.before_request
def only_allow_get():
    if request.method != "GET":
        abort(405, description="Hanya metode GET yang diizinkan untuk guest")

@investor_bp.route("/dashboard", methods=["GET"])
@limiter.limit("20 per minute")
def investor_dashboard():
    return jsonify({
        "success": True,
        "message": "Dashboard publik (guest mode)",
        "data": "Informasi saham umum, grafik, dll"
    }), 200

@investor_bp.route("/stocks", methods=["GET"])
@limiter.limit("30 per minute")
def stocks():
    return jsonify({
        "success": True,
        "stocks": []
    }), 200