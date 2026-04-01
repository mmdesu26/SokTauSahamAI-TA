from flask import Blueprint, request, jsonify, g
from app import db, limiter
from app.models import User
from app.utils.jwt_helper import generate_jwt
from app.utils.auth_decorators import token_required, role_required
from app.utils.logger import log_auth
import logging
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth_bp", __name__)


@auth_bp.route("/login", methods=["POST"])
@limiter.limit("5 per minute")
def login():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()
    ip_address = request.headers.get("X-Forwarded-For", request.remote_addr)

    if not username or not password:
        log_auth("LOGIN", username or "unknown", success=False, error_msg="Username atau password kosong", ip_address=ip_address)
        return jsonify({"success": False, "message": "Username dan password wajib diisi."}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        log_auth("LOGIN", username, success=False, error_msg="Username atau password salah", ip_address=ip_address)
        return jsonify({"success": False, "message": "Username atau password salah."}), 401

    token = generate_jwt(user)
    user_data = {
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "role": "admin",
    }

    log_auth("LOGIN", username, user_id=user.id, success=True, ip_address=ip_address)
    return jsonify({
        "success": True,
        "message": "Login berhasil sebagai admin.",
        "token": token,
        "user": user_data,
        "expiresInMinutes": 20,
    }), 200


@auth_bp.route("/logout", methods=["POST"])
@token_required
@role_required("admin")
def logout():
    username = g.current_user.get("username", "unknown")
    user_id = g.current_user.get("id")
    ip_address = request.headers.get("X-Forwarded-For", request.remote_addr)
    log_auth("LOGOUT", username, user_id=user_id, success=True, ip_address=ip_address)
    return jsonify({"success": True, "message": "Logout berhasil."}), 200


@auth_bp.route("/me", methods=["GET"])
@token_required
@role_required("admin")
def me():
    return jsonify({"success": True, "user": g.current_user}), 200


@auth_bp.route("/change-password", methods=["POST"])
@token_required
@role_required("admin")
def change_password():
    ip_address = request.headers.get("X-Forwarded-For", request.remote_addr)
    username = g.current_user.get("username")
    user_id = g.current_user.get("id")

    try:
        data = request.get_json() or {}
        old_password = (data.get("oldPassword") or "").strip()
        new_password = (data.get("newPassword") or "").strip()
        confirm_password = (data.get("confirmPassword") or "").strip()

        if not old_password or not new_password or not confirm_password:
            return jsonify({"success": False, "message": "Semua field wajib diisi."}), 400

        if len(new_password) < 8:
            return jsonify({"success": False, "message": "Password baru minimal 8 karakter."}), 400

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

        if new_password != confirm_password:
            return jsonify({"success": False, "message": "Password baru dan konfirmasi tidak sama."}), 400

        user = User.query.filter_by(username=username).first()
        if not user:
            log_auth("PASSWORD_CHANGE", username, user_id=user_id, success=False, error_msg="User tidak ditemukan", ip_address=ip_address)
            return jsonify({"success": False, "message": "User tidak ditemukan."}), 404

        if not user.check_password(old_password):
            log_auth("PASSWORD_CHANGE", username, user_id=user.id, success=False, error_msg="Password lama salah", ip_address=ip_address)
            return jsonify({"success": False, "message": "Password lama salah."}), 400

        if user.check_password(new_password):
            return jsonify({"success": False, "message": "Password baru tidak boleh sama dengan password lama."}), 400

        user.set_password(new_password)
        db.session.commit()
        log_auth("PASSWORD_CHANGE", username, user_id=user.id, success=True, ip_address=ip_address)
        return jsonify({
            "success": True,
            "message": "Password berhasil diubah. Silakan login kembali dengan password baru."
        }), 200
    except Exception as e:
        db.session.rollback()
        logger.exception("Terjadi error saat change password")
        log_auth("PASSWORD_CHANGE", username or "unknown", user_id=user_id, success=False, error_msg=str(e), ip_address=ip_address)
        return jsonify({"success": False, "message": "Terjadi kesalahan server."}), 500
