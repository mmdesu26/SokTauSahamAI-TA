from flask import Blueprint, request, jsonify, g
from app import db, bcrypt
from app.models import User
from app.utils.jwt_helper import generate_jwt
from app.utils.auth_decorators import token_required, role_required
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth_bp", __name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not password:
        logger.warning("Login gagal: username atau password kosong")
        return jsonify({
            "success": False,
            "message": "Username dan password wajib diisi."
        }), 400

    user = User.query.filter_by(username=username).first()

    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        logger.info(f"Login gagal untuk username: {username}")
        return jsonify({
            "success": False,
            "message": "Username atau password salah."
        }), 401

    token = generate_jwt(user)

    user_data = {
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "role": "admin"
    }

    logger.info(f"Login berhasil untuk username: {username}")

    return jsonify({
        "success": True,
        "message": "Login berhasil sebagai admin.",
        "token": token,
        "user": user_data
    }), 200


@auth_bp.route("/me", methods=["GET"])
@token_required
@role_required("admin")
def me():
    return jsonify({
        "success": True,
        "user": g.current_user
    }), 200


@auth_bp.route("/change-password", methods=["POST"])
@token_required
@role_required("admin")
def change_password():
    data = request.get_json() or {}

    old_password = (data.get("oldPassword") or "").strip()
    new_password = (data.get("newPassword") or "").strip()
    confirm_password = (data.get("confirmPassword") or "").strip()

    if not old_password or not new_password or not confirm_password:
        logger.warning("Change password gagal: field tidak lengkap")
        return jsonify({
            "success": False,
            "message": "Semua field wajib diisi."
        }), 400

    if new_password != confirm_password:
        logger.warning("Change password gagal: password baru dan konfirmasi tidak sama")
        return jsonify({
            "success": False,
            "message": "Password baru dan konfirmasi tidak sama."
        }), 400

    username = g.current_user.get("username")
    user = User.query.filter_by(username=username).first()

    if not user:
        logger.warning(f"User dari token tidak ditemukan: {username}")
        return jsonify({
            "success": False,
            "message": "User tidak ditemukan."
        }), 404

    if not bcrypt.check_password_hash(user.password_hash, old_password):
        logger.warning(f"Password lama salah untuk {username}")
        return jsonify({
            "success": False,
            "message": "Password lama salah."
        }), 401

    user.password_hash = bcrypt.generate_password_hash(new_password).decode("utf-8")
    db.session.commit()

    logger.info(f"Password berhasil diubah untuk username: {username}")

    return jsonify({
        "success": True,
        "message": "Password berhasil diubah. Silakan login kembali dengan password baru."
    }), 200