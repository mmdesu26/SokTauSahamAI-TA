from functools import wraps
from flask import request, jsonify, g
import jwt
from app.utils.jwt_helper import decode_jwt

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return jsonify({
                "success": False,
                "message": "Token tidak ditemukan."
            }), 401

        token = auth_header.split(" ")[1]

        try:
            payload = decode_jwt(token)
            g.current_user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({
                "success": False,
                "message": "Sesi telah berakhir. Silakan login kembali."
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                "success": False,
                "message": "Token tidak valid."
            }), 401

        return f(*args, **kwargs)
    return decorated

def role_required(*allowed_roles):
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