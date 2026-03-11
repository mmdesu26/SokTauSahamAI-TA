from flask import Blueprint, jsonify, g
from app.utils.auth_decorators import token_required, role_required

admin_bp = Blueprint("admin_bp", __name__)

@admin_bp.route("/dashboard", methods=["GET"])
@token_required
@role_required("admin")
def admin_dashboard():
    return jsonify({
        "success": True,
        "message": "Selamat datang di dashboard admin.",
        "user": g.current_user
    }), 200