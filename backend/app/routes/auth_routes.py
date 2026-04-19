# Import Blueprint, request, jsonify, dan g dari Flask
# - Blueprint: untuk mengelompokkan route dalam modul auth
# - request: untuk mengambil data request dari client
# - jsonify: untuk mengembalikan response JSON
# - g: global context Flask, biasanya dipakai menyimpan user yang sedang login
from flask import Blueprint, request, jsonify, g

# Import db dan limiter dari app
# - db: object SQLAlchemy untuk akses database
# - limiter: rate limiter untuk membatasi jumlah request
from app import db, limiter

# Import model User dari database
from app.models import User

# Import helper untuk generate JWT token
from app.utils.jwt_helper import generate_jwt

# Import decorator untuk validasi token dan role user
from app.utils.auth_decorators import token_required, role_required

# Import logger khusus auth untuk mencatat login/logout/perubahan password
from app.utils.logger import log_auth

# Import logging bawaan Python
import logging

# Import regex untuk validasi pola password
import re

# Mengatur basic config logging ke level INFO
logging.basicConfig(level=logging.INFO)

# Membuat logger berdasarkan nama file/module ini
logger = logging.getLogger(__name__)

# Membuat blueprint auth
# Nama blueprint: auth_bp
auth_bp = Blueprint("auth_bp", __name__)


# Route untuk login admin
@auth_bp.route("/login", methods=["POST"])
# Membatasi login maksimal 5 kali per menit untuk mencegah brute force attack
@limiter.limit("5 per minute")
def login():
    # Mengambil body JSON dari request
    # Jika request kosong / None, fallback ke dictionary kosong
    data = request.get_json() or {}

    # Mengambil username dari JSON, lalu hapus spasi kiri-kanan
    username = (data.get("username") or "").strip()

    # Mengambil password dari JSON, lalu hapus spasi kiri-kanan
    password = (data.get("password") or "").strip()

    # Mengambil IP address user
    # Prioritaskan header X-Forwarded-For jika aplikasi berada di balik proxy
    # Jika tidak ada, gunakan request.remote_addr
    ip_address = request.headers.get("X-Forwarded-For", request.remote_addr)

    # Validasi: username dan password wajib diisi
    if not username or not password:
        # Catat log login gagal
        log_auth(
            "LOGIN",
            username or "unknown",
            success=False,
            error_msg="Username atau password kosong",
            ip_address=ip_address
        )

        # Return response error 400 Bad Request
        return jsonify({
            "success": False,
            "message": "Username dan password wajib diisi."
        }), 400

    # Cari user berdasarkan username di database
    user = User.query.filter_by(username=username).first()

    # Validasi:
    # - jika user tidak ditemukan
    # - atau password tidak cocok
    if not user or not user.check_password(password):
        # Catat log login gagal
        log_auth(
            "LOGIN",
            username,
            success=False,
            error_msg="Username atau password salah",
            ip_address=ip_address
        )

        # Return response unauthorized
        return jsonify({
            "success": False,
            "message": "Username atau password salah."
        }), 401

    # Jika valid, generate JWT token untuk user
    token = generate_jwt(user)

    # Siapkan data user yang akan dikirim ke frontend
    # Role di-hardcode sebagai admin
    user_data = {
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "role": "admin",
    }

    # Catat log login berhasil
    log_auth(
        "LOGIN",
        username,
        user_id=user.id,
        success=True,
        ip_address=ip_address
    )

    # Return response sukses login
    return jsonify({
        "success": True,
        "message": "Login berhasil sebagai admin.",
        "token": token,
        "user": user_data,
        "expiresInMinutes": 20,  # informasi masa berlaku token
    }), 200


# Route untuk logout
@auth_bp.route("/logout", methods=["POST"])
# Harus punya token valid
@token_required
# Harus role admin
@role_required("admin")
def logout():
    # Ambil username dari user yang tersimpan di global context Flask
    username = g.current_user.get("username", "unknown")

    # Ambil user id dari global context
    user_id = g.current_user.get("id")

    # Ambil IP address user
    ip_address = request.headers.get("X-Forwarded-For", request.remote_addr)

    # Catat log logout berhasil
    log_auth(
        "LOGOUT",
        username,
        user_id=user_id,
        success=True,
        ip_address=ip_address
    )

    # Return response sukses logout
    # Catatan: logout di sini hanya logging, tidak menghapus token JWT di server
    return jsonify({
        "success": True,
        "message": "Logout berhasil."
    }), 200


# Route untuk mengambil data user yang sedang login
@auth_bp.route("/me", methods=["GET"])
# Harus punya token valid
@token_required
# Harus role admin
@role_required("admin")
def me():
    # Mengembalikan data user dari token yang sudah diparsing oleh decorator
    return jsonify({
        "success": True,
        "user": g.current_user
    }), 200


# Route untuk mengganti password user yang sedang login
@auth_bp.route("/change-password", methods=["POST"])
# Harus punya token valid
@token_required
# Harus role admin
@role_required("admin")
def change_password():
    # Ambil IP address user
    ip_address = request.headers.get("X-Forwarded-For", request.remote_addr)

    # Ambil username dari current user
    username = g.current_user.get("username")

    # Ambil user id dari current user
    user_id = g.current_user.get("id")

    try:
        # Ambil body JSON dari request
        data = request.get_json() or {}

        # Ambil password lama
        old_password = (data.get("oldPassword") or "").strip()

        # Ambil password baru
        new_password = (data.get("newPassword") or "").strip()

        # Ambil konfirmasi password baru
        confirm_password = (data.get("confirmPassword") or "").strip()

        # Validasi semua field wajib diisi
        if not old_password or not new_password or not confirm_password:
            return jsonify({
                "success": False,
                "message": "Semua field wajib diisi."
            }), 400

        # Validasi panjang minimum password baru
        if len(new_password) < 8:
            return jsonify({
                "success": False,
                "message": "Password baru minimal 8 karakter."
            }), 400

        # Validasi kekuatan password:
        # - minimal 1 huruf besar
        # - minimal 1 huruf kecil
        # - minimal 1 angka
        # - minimal 1 simbol
        if not (
            re.search(r"[A-Z]", new_password)
            and re.search(r"[a-z]", new_password)
            and re.search(r"\d", new_password)
            and re.search(r"[!@#$%^&*()_+\-=\[\]{};:'\",.<>/?]", new_password)
        ):
            return jsonify({
                "success": False,
                "message": "Password baru harus mengandung minimal 1 huruf besar, 1 huruf kecil, 1 angka, dan 1 simbol."
            }), 400

        # Validasi password baru dan konfirmasi harus sama
        if new_password != confirm_password:
            return jsonify({
                "success": False,
                "message": "Password baru dan konfirmasi tidak sama."
            }), 400

        # Ambil user dari database berdasarkan username yang sedang login
        user = User.query.filter_by(username=username).first()

        # Jika user tidak ditemukan
        if not user:
            # Catat log gagal
            log_auth(
                "PASSWORD_CHANGE",
                username,
                user_id=user_id,
                success=False,
                error_msg="User tidak ditemukan",
                ip_address=ip_address
            )

            return jsonify({
                "success": False,
                "message": "User tidak ditemukan."
            }), 404

        # Validasi password lama harus benar
        if not user.check_password(old_password):
            # Catat log gagal
            log_auth(
                "PASSWORD_CHANGE",
                username,
                user_id=user.id,
                success=False,
                error_msg="Password lama salah",
                ip_address=ip_address
            )

            return jsonify({
                "success": False,
                "message": "Password lama salah."
            }), 400

        # Validasi password baru tidak boleh sama dengan password lama
        if user.check_password(new_password):
            return jsonify({
                "success": False,
                "message": "Password baru tidak boleh sama dengan password lama."
            }), 400

        # Set password baru
        # Biasanya method ini akan hash password sebelum disimpan ke database
        user.set_password(new_password)

        # Simpan perubahan ke database
        db.session.commit()

        # Catat log sukses ganti password
        log_auth(
            "PASSWORD_CHANGE",
            username,
            user_id=user.id,
            success=True,
            ip_address=ip_address
        )

        # Return response sukses
        return jsonify({
            "success": True,
            "message": "Password berhasil diubah. Silakan login kembali dengan password baru."
        }), 200

    except Exception as e:
        # Jika terjadi error, rollback perubahan database
        db.session.rollback()

        # Catat exception ke logger
        logger.exception("Terjadi error saat change password")

        # Catat log auth gagal
        log_auth(
            "PASSWORD_CHANGE",
            username or "unknown",
            user_id=user_id,
            success=False,
            error_msg=str(e),
            ip_address=ip_address
        )

        # Return response error server
        return jsonify({
            "success": False,
            "message": "Terjadi kesalahan server."
        }), 500