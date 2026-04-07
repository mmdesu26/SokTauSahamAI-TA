from flask import Blueprint, jsonify, request

from app import db
from app.models import Glossary

glossary_bp = Blueprint("glossary_bp", __name__)

ALLOWED_STATUSES = ["literature_based", "verified"]


def normalize_glossary_payload(data):
    return {
        "term": (data.get("term") or "").strip(),
        "definition": (data.get("definition") or "").strip(),
        "source_url": (data.get("source_url") or "").strip() or None,
        "verification_status": (
            (data.get("verification_status") or "literature_based").strip()
        ),
        "verified_by": (data.get("verified_by") or "").strip() or None,
    }


def validate_glossary_payload(payload):
    if not payload["term"]:
        return "Istilah wajib diisi."

    if not payload["definition"]:
        return "Definisi wajib diisi."

    if payload["verification_status"] not in ALLOWED_STATUSES:
        return "Status verifikasi tidak valid."

    if payload["verification_status"] == "verified" and not payload["verified_by"]:
        return "Nama verifier wajib diisi jika status terverifikasi."

    return None


@glossary_bp.route("/glossary", methods=["GET"])
def get_glossary():
    search = request.args.get("search", "").strip()
    verification_status = request.args.get("verification_status", "").strip()

    query = Glossary.query

    if search:
        keyword = f"%{search}%"
        query = query.filter(
            db.or_(
                Glossary.term.ilike(keyword),
                Glossary.definition.ilike(keyword),
                Glossary.verified_by.ilike(keyword),
            )
        )

    if verification_status:
        query = query.filter(Glossary.verification_status == verification_status)

    items = query.order_by(Glossary.term.asc()).all()

    return jsonify(
        {
            "success": True,
            "data": [item.to_dict() for item in items],
        }
    ), 200


@glossary_bp.route("/glossary/<int:glossary_id>", methods=["GET"])
def get_glossary_detail(glossary_id):
    glossary = Glossary.query.get(glossary_id)

    if not glossary:
        return jsonify(
            {
                "success": False,
                "message": "Data glosarium tidak ditemukan.",
            }
        ), 404

    return jsonify(
        {
            "success": True,
            "data": glossary.to_dict(),
        }
    ), 200


@glossary_bp.route("/admin/glossary", methods=["POST"])
def create_glossary():
    data = request.get_json() or {}
    payload = normalize_glossary_payload(data)

    error_message = validate_glossary_payload(payload)
    if error_message:
        return jsonify({"success": False, "message": error_message}), 400

    existing = Glossary.query.filter_by(term=payload["term"]).first()
    if existing:
        return jsonify({"success": False, "message": "Istilah sudah ada."}), 409

    glossary = Glossary(**payload)

    db.session.add(glossary)
    db.session.commit()

    return jsonify(
        {
            "success": True,
            "message": "Istilah berhasil ditambahkan.",
            "data": glossary.to_dict(),
        }
    ), 201


@glossary_bp.route("/admin/glossary/<int:glossary_id>", methods=["PUT"])
def update_glossary(glossary_id):
    glossary = Glossary.query.get(glossary_id)

    if not glossary:
        return jsonify(
            {
                "success": False,
                "message": "Data glosarium tidak ditemukan.",
            }
        ), 404

    data = request.get_json() or {}
    payload = normalize_glossary_payload(data)

    error_message = validate_glossary_payload(payload)
    if error_message:
        return jsonify({"success": False, "message": error_message}), 400

    existing = Glossary.query.filter(
        Glossary.term == payload["term"],
        Glossary.id != glossary_id,
    ).first()

    if existing:
        return jsonify(
            {
                "success": False,
                "message": "Istilah sudah digunakan data lain.",
            }
        ), 409

    glossary.term = payload["term"]
    glossary.definition = payload["definition"]
    glossary.source_url = payload["source_url"]
    glossary.verification_status = payload["verification_status"]
    glossary.verified_by = payload["verified_by"]

    db.session.commit()

    return jsonify(
        {
            "success": True,
            "message": "Data glosarium berhasil diperbarui.",
            "data": glossary.to_dict(),
        }
    ), 200


@glossary_bp.route("/admin/glossary/<int:glossary_id>", methods=["DELETE"])
def delete_glossary(glossary_id):
    glossary = Glossary.query.get(glossary_id)

    if not glossary:
        return jsonify(
            {
                "success": False,
                "message": "Data glosarium tidak ditemukan.",
            }
        ), 404

    db.session.delete(glossary)
    db.session.commit()

    return jsonify(
        {
            "success": True,
            "message": "Data glosarium berhasil dihapus.",
        }
    ), 200