# Import wraps dari functools
# Digunakan agar decorator tetap mempertahankan nama dan metadata fungsi asli
from functools import wraps

# Import request, jsonify, dan g dari Flask
# - request: untuk membaca header HTTP
# - jsonify: untuk mengembalikan response JSON
# - g: global context Flask untuk menyimpan data user selama request berlangsung
from flask import request, jsonify, g

# Import library jwt untuk menangani exception token JWT
import jwt

# Import logging bawaan Python
import logging

# Import helper decode_jwt untuk memverifikasi dan membaca isi token
from app.utils.jwt_helper import decode_jwt

# Membuat logger untuk file/module ini
logger = logging.getLogger(__name__)


def token_required(f):
    """
    Decorator untuk memastikan endpoint hanya bisa diakses
    jika request memiliki token JWT yang valid.

    Cara kerja:
    1. Ambil header Authorization
    2. Pastikan formatnya 'Bearer <token>'
    3. Decode token
    4. Simpan payload token ke g.current_user
    5. Jika valid, lanjut ke fungsi endpoint
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # Ambil header Authorization
        # Jika tidak ada, default string kosong
        auth_header = request.headers.get("Authorization", "")

        # Validasi apakah header diawali dengan 'Bearer '
        # Contoh format yang benar:
        # Authorization: Bearer eyJhbGciOi...
        if not auth_header.startswith("Bearer "):
            return jsonify({
                "success": False,
                "message": "Token tidak ditemukan."
            }), 401

        # Ambil token setelah kata 'Bearer '
        token = auth_header.split(" ")[1]

        try:
            # Decode token JWT
            # Jika valid, payload akan berisi data user (misalnya id, username, role)
            payload = decode_jwt(token)

            # Simpan payload ke Flask global context
            # Supaya bisa dipakai di endpoint berikutnya
            g.current_user = payload

        # Jika token sudah expired
        except jwt.ExpiredSignatureError:
            logger.warning("JWT expired")
            return jsonify({
                "success": False,
                "message": "Sesi telah berakhir. Silakan login kembali."
            }), 401

        # Jika token tidak valid (rusak, salah format, signature salah, dll)
        except jwt.InvalidTokenError as e:
            logger.warning(f"JWT invalid: {str(e)}")
            return jsonify({
                "success": False,
                "message": "Token tidak valid."
            }), 401

        # Jika token valid, lanjut jalankan fungsi endpoint asli
        return f(*args, **kwargs)

    return decorated


def role_required(*allowed_roles):
    """
    Decorator untuk membatasi akses endpoint berdasarkan role user.

    Parameter:
    - allowed_roles: daftar role yang diizinkan
      contoh: @role_required("admin")
      contoh lain: @role_required("admin", "superadmin")

    Cara kerja:
    1. Ambil current_user dari g
    2. Pastikan user sudah login
    3. Cek apakah role user ada di allowed_roles
    4. Jika sesuai, lanjut ke endpoint
    """
    def wrapper(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            # Ambil data user yang sebelumnya disimpan oleh token_required
            current_user = getattr(g, "current_user", None)

            # Jika tidak ada current_user, berarti user belum terautentikasi
            if not current_user:
                return jsonify({
                    "success": False,
                    "message": "Unauthorized."
                }), 401

            # Jika role user tidak termasuk dalam daftar yang diizinkan
            if current_user.get("role") not in allowed_roles:
                return jsonify({
                    "success": False,
                    "message": "Akses ditolak."
                }), 403

            # Jika role sesuai, lanjut jalankan fungsi endpoint asli
            return f(*args, **kwargs)

        return decorated

    return wrapper