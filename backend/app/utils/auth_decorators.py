# Import wraps agar decorator tidak merusak fungsi asli
from functools import wraps

# Import flask utilities
from flask import request, jsonify, g

# Import jwt untuk handle error
import jwt

# Import logging
import logging

# Import helper decode token
from app.utils.jwt_helper import decode_jwt

# Import model user untuk cek token_version
from app.models import User

logger = logging.getLogger(__name__)


def token_required(f):
    """
    Decorator untuk validasi JWT token.

    Alur:
    1. Ambil Authorization header
    2. Validasi format Bearer token
    3. Decode token
    4. Cocokkan token_version
    5. Simpan user ke g.current_user
    """

    @wraps(f)
    def decorated(*args, **kwargs):

        # Ambil header Authorization
        auth_header = request.headers.get("Authorization", "")

        # Validasi format Bearer token
        if not auth_header.startswith("Bearer "):
            return jsonify({
                "success": False,
                "message": "Token tidak ditemukan."
            }), 401

        # Ambil token
        token = auth_header.split(" ")[1]

        try:
            # Decode token
            payload = decode_jwt(token)

            # Ambil user dari DB
            user = User.query.get(payload.get("id"))

            if not user:
                return jsonify({
                    "success": False,
                    "message": "User tidak ditemukan."
                }), 401

            # 🔥 Cek token_version
            # Kalau beda → token lama → tidak valid
            if payload.get("token_version") != user.token_version:
                return jsonify({
                    "success": False,
                    "message": "Sesi tidak valid. Silakan login kembali."
                }), 401

            # Simpan ke global context
            g.current_user = {
                "id": user.id,
                "username": user.username,
                "role": "admin"
            }

        except jwt.ExpiredSignatureError:
            logger.warning("JWT expired")
            return jsonify({
                "success": False,
                "message": "Sesi telah berakhir."
            }), 401

        except jwt.InvalidTokenError:
            logger.warning("JWT invalid")
            return jsonify({
                "success": False,
                "message": "Token tidak valid."
            }), 401

        return f(*args, **kwargs)

    return decorated


def role_required(*allowed_roles):
    """
    Membatasi akses berdasarkan role.
    """

    def wrapper(f):
        @wraps(f)
        def decorated(*args, **kwargs):

            current_user = getattr(g, "current_user", None)

            if not current_user:
                return jsonify({
                    "success": False,
                    "message": "Unauthorized."
                }), 401

            if current_user.get("role") not in allowed_roles:
                return jsonify({
                    "success": False,
                    "message": "Akses ditolak."
                }), 403

            return f(*args, **kwargs)

        return decorated

    return wrapper