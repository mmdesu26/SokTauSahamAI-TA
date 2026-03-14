from flask import Blueprint, request, jsonify
from app import db
from app.models import Glossary

glossary_bp = Blueprint("glossary_bp", __name__)

@glossary_bp.route("/glossary", methods=["GET"])
def get_glossary():
    search = request.args.get("search", "").strip()

    query = Glossary.query

    if search:
        keyword = f"%{search}%"
        query = query.filter(
            db.or_(
                Glossary.term.ilike(keyword),
                Glossary.definition.ilike(keyword)
            )
        )

    items = query.order_by(Glossary.term.asc()).all()

    return jsonify({
        "success": True,
        "data": [item.to_dict() for item in items]
    }), 200

@glossary_bp.route("/admin/glossary", methods=["POST"])
def create_glossary():
    data = request.get_json() or {}

    term = (data.get("term") or "").strip()
    definition = (data.get("definition") or "").strip()

    if not term:
        return jsonify({
            "success": False,
            "message": "Istilah wajib diisi."
        }), 400

    if not definition:
        return jsonify({
            "success": False,
            "message": "Definisi wajib diisi."
        }), 400

    existing = Glossary.query.filter_by(term=term).first()
    if existing:
        return jsonify({
            "success": False,
            "message": "Istilah sudah ada."
        }), 409

    glossary = Glossary(term=term, definition=definition)
    db.session.add(glossary)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Istilah berhasil ditambahkan.",
        "data": glossary.to_dict()
    }), 201

@glossary_bp.route("/admin/glossary/<int:glossary_id>", methods=["PUT"])
def update_glossary(glossary_id):
    glossary = Glossary.query.get(glossary_id)

    if not glossary:
        return jsonify({
            "success": False,
            "message": "Data glosarium tidak ditemukan."
        }), 404

    data = request.get_json() or {}

    term = (data.get("term") or "").strip()
    definition = (data.get("definition") or "").strip()

    if not term:
        return jsonify({
            "success": False,
            "message": "Istilah wajib diisi."
        }), 400

    if not definition:
        return jsonify({
            "success": False,
            "message": "Definisi wajib diisi."
        }), 400

    existing = Glossary.query.filter(
        Glossary.term == term,
        Glossary.id != glossary_id
    ).first()

    if existing:
        return jsonify({
            "success": False,
            "message": "Istilah sudah digunakan data lain."
        }), 409

    glossary.term = term
    glossary.definition = definition
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Data glosarium berhasil diperbarui.",
        "data": glossary.to_dict()
    }), 200

@glossary_bp.route("/admin/glossary/<int:glossary_id>", methods=["DELETE"])
def delete_glossary(glossary_id):
    glossary = Glossary.query.get(glossary_id)

    if not glossary:
        return jsonify({
            "success": False,
            "message": "Data glosarium tidak ditemukan."
        }), 404

    db.session.delete(glossary)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Data glosarium berhasil dihapus."
    }), 200


