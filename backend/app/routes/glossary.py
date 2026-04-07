from datetime import datetime

from flask import Blueprint, jsonify, request

from app import db
from app.models import Glossary

glossary_bp = Blueprint("glossary_bp", __name__)

ALLOWED_STATUSES = ["literature_based", "reviewed", "verified"]


def normalize_glossary_payload(data):
    return {
        "term": (data.get("term") or "").strip(),
        "definition": (data.get("definition") or "").strip(),
        "category": (data.get("category") or "").strip() or None,
        "source_type": (data.get("source_type") or "official_literature").strip(),
        "source_name": (data.get("source_name") or "").strip(),
        "source_organization": (data.get("source_organization") or "").strip() or None,
        "source_year": (data.get("source_year") or "").strip() or None,
        "source_url": (data.get("source_url") or "").strip() or None,
        "source_reference": (data.get("source_reference") or "").strip() or None,
        "verification_status": (
            (data.get("verification_status") or "literature_based").strip()
        ),
        "verified_by": (data.get("verified_by") or "").strip() or None,
        "verifier_role": (data.get("verifier_role") or "").strip() or None,
        "verification_notes": (data.get("verification_notes") or "").strip() or None,
    }


def validate_glossary_payload(payload):
    if not payload["term"]:
        return "Istilah wajib diisi."

    if not payload["definition"]:
        return "Definisi wajib diisi."

    if not payload["source_name"]:
        return "Nama sumber wajib diisi."

    if payload["verification_status"] not in ALLOWED_STATUSES:
        return "Status verifikasi tidak valid."

    return None


@glossary_bp.route("/glossary", methods=["GET"])
def get_glossary():
    search = request.args.get("search", "").strip()
    category = request.args.get("category", "").strip()
    verification_status = request.args.get("verification_status", "").strip()

    query = Glossary.query

    if search:
        keyword = f"%{search}%"
        query = query.filter(
            db.or_(
                Glossary.term.ilike(keyword),
                Glossary.definition.ilike(keyword),
                Glossary.category.ilike(keyword),
                Glossary.source_name.ilike(keyword),
                Glossary.source_organization.ilike(keyword),
            )
        )

    if category:
        query = query.filter(Glossary.category == category)

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


@glossary_bp.route("/glossary/categories", methods=["GET"])
def get_glossary_categories():
    rows = (
        db.session.query(Glossary.category)
        .filter(Glossary.category.isnot(None))
        .filter(Glossary.category != "")
        .distinct()
        .order_by(Glossary.category.asc())
        .all()
    )

    categories = [row[0] for row in rows]

    return jsonify(
        {
            "success": True,
            "data": categories,
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

    if payload["verification_status"] == "verified":
        glossary.verified_at = datetime.utcnow()

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
    glossary.category = payload["category"]
    glossary.source_type = payload["source_type"]
    glossary.source_name = payload["source_name"]
    glossary.source_organization = payload["source_organization"]
    glossary.source_year = payload["source_year"]
    glossary.source_url = payload["source_url"]
    glossary.source_reference = payload["source_reference"]
    glossary.verification_status = payload["verification_status"]
    glossary.verified_by = payload["verified_by"]
    glossary.verifier_role = payload["verifier_role"]
    glossary.verification_notes = payload["verification_notes"]

    if payload["verification_status"] == "verified":
        if not glossary.verified_at:
            glossary.verified_at = datetime.utcnow()
    else:
        glossary.verified_at = None

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