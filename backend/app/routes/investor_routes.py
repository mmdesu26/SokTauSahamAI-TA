# Import Blueprint, jsonify, abort, dan request dari Flask
# - Blueprint: untuk grouping route
# - jsonify: untuk response JSON
# - abort: untuk menghentikan request dengan error HTTP
# - request: untuk akses method request (GET, POST, dll)
from flask import Blueprint, jsonify, abort, request

# Import limiter untuk rate limiting (batasi jumlah request user)
from app import limiter


# Membuat blueprint untuk investor (guest/public user)
investor_bp = Blueprint("investor_bp", __name__)


# =========================
# Middleware / Hook
# =========================
@investor_bp.before_request
def only_allow_get():
    """
    Middleware yang dijalankan sebelum setiap request di blueprint ini.
    Fungsinya: membatasi hanya method GET yang diperbolehkan.
    """
    # Jika method bukan GET → tolak request
    if request.method != "GET":
        abort(405, description="Hanya metode GET yang diizinkan untuk guest")


# =========================
# ROUTES (PUBLIC / GUEST)
# =========================

@investor_bp.route("/dashboard", methods=["GET"])
# Batasi maksimal 20 request per menit
@limiter.limit("20 per minute")
def investor_dashboard():
    """
    Endpoint dashboard publik (guest mode)
    Biasanya digunakan untuk menampilkan:
    - overview saham
    - ringkasan market
    - grafik umum
    """
    return jsonify({
        "success": True,
        "message": "Dashboard publik (guest mode)",
        "data": "Informasi saham umum, grafik, dll"
    }), 200


@investor_bp.route("/stocks", methods=["GET"])
# Batasi maksimal 30 request per menit
@limiter.limit("30 per minute")
def stocks():
    """
    Endpoint untuk mengambil daftar saham (public)
    Saat ini masih dummy (kosong)
    Biasanya akan diisi dengan:
    - list saham
    - harga terbaru
    - ringkasan data
    """
    return jsonify({
        "success": True,
        "stocks": []  # placeholder data saham
    }), 200