import json
import os

from sqlalchemy import inspect, text

from app import create_app, db, bcrypt
from app.models import User, Glossary
from app.utils.logger import cleanup_old_logs

app = create_app()


def ensure_glossary_schema():
    inspector = inspect(db.engine)

    if "glossaries" not in inspector.get_table_names():
        return

    existing_columns = {col["name"] for col in inspector.get_columns("glossaries")}
    alter_statements = []

    if "category" not in existing_columns:
        alter_statements.append(
            "ALTER TABLE glossaries ADD COLUMN category VARCHAR(100) NULL"
        )
    if "source_type" not in existing_columns:
        alter_statements.append(
            "ALTER TABLE glossaries ADD COLUMN source_type VARCHAR(50) NOT NULL DEFAULT 'official_literature'"
        )
    if "source_name" not in existing_columns:
        alter_statements.append(
            "ALTER TABLE glossaries ADD COLUMN source_name VARCHAR(255) NULL"
        )
    if "source_organization" not in existing_columns:
        alter_statements.append(
            "ALTER TABLE glossaries ADD COLUMN source_organization VARCHAR(255) NULL"
        )
    if "source_year" not in existing_columns:
        alter_statements.append(
            "ALTER TABLE glossaries ADD COLUMN source_year VARCHAR(20) NULL"
        )
    if "source_url" not in existing_columns:
        alter_statements.append(
            "ALTER TABLE glossaries ADD COLUMN source_url TEXT NULL"
        )
    if "source_reference" not in existing_columns:
        alter_statements.append(
            "ALTER TABLE glossaries ADD COLUMN source_reference TEXT NULL"
        )
    if "verification_status" not in existing_columns:
        alter_statements.append(
            "ALTER TABLE glossaries ADD COLUMN verification_status VARCHAR(30) NOT NULL DEFAULT 'literature_based'"
        )
    if "verified_by" not in existing_columns:
        alter_statements.append(
            "ALTER TABLE glossaries ADD COLUMN verified_by VARCHAR(150) NULL"
        )
    if "verifier_role" not in existing_columns:
        alter_statements.append(
            "ALTER TABLE glossaries ADD COLUMN verifier_role VARCHAR(150) NULL"
        )
    if "verified_at" not in existing_columns:
        alter_statements.append(
            "ALTER TABLE glossaries ADD COLUMN verified_at DATETIME NULL"
        )
    if "verification_notes" not in existing_columns:
        alter_statements.append(
            "ALTER TABLE glossaries ADD COLUMN verification_notes TEXT NULL"
        )

    with db.engine.begin() as connection:
        for sql in alter_statements:
            connection.execute(text(sql))

        connection.execute(
            text(
                """
                UPDATE glossaries
                SET
                    source_type = COALESCE(NULLIF(source_type, ''), 'official_literature'),
                    source_name = COALESCE(NULLIF(source_name, ''), 'Literatur Resmi Pasar Modal Indonesia'),
                    source_organization = COALESCE(NULLIF(source_organization, ''), 'OJK / BEI'),
                    source_year = COALESCE(NULLIF(source_year, ''), '2026'),
                    source_reference = COALESCE(NULLIF(source_reference, ''), 'Data lama yang disesuaikan ke format baru.'),
                    verification_status = COALESCE(NULLIF(verification_status, ''), 'literature_based')
                """
            )
        )

    print("Schema glossary sudah dicek/diperbarui.")


def load_glossary_seed():
    json_path = os.path.join(os.path.dirname(__file__), "glossary_seed.json")

    if not os.path.exists(json_path):
        print(f"File glossary_seed.json tidak ditemukan: {json_path}")
        return []

    try:
        with open(json_path, "r", encoding="utf-8") as file:
            data = json.load(file)
        return data if isinstance(data, list) else []
    except Exception as error:
        print(f"Gagal membaca glossary_seed.json: {error}")
        return []


def seed_default_admin():
    admin = User.query.filter_by(username="admin").first()

    if not admin:
        hashed_password = bcrypt.generate_password_hash("admin123").decode("utf-8")
        admin_user = User(
            username="admin",
            name="Administrator",
            password_hash=hashed_password
        )
        db.session.add(admin_user)
        db.session.commit()
        print("Admin default berhasil dibuat: username 'admin', password 'admin123'")
    else:
        print("Admin default sudah ada.")


def seed_glossary_from_json():
    glossary_seed = load_glossary_seed()

    if not glossary_seed:
        print("Seed glosarium dilewati karena JSON kosong.")
        return

    inserted_count = 0

    for item in glossary_seed:
        term = (item.get("term") or "").strip()
        definition = (item.get("definition") or "").strip()

        if not term or not definition:
            continue

        exists = Glossary.query.filter_by(term=term).first()
        if exists:
            continue

        glossary = Glossary(
            term=term,
            definition=definition,
            category=(item.get("category") or "").strip() or None,
            source_type=(item.get("source_type") or "official_literature").strip(),
            source_name=(item.get("source_name") or "Literatur Resmi Pasar Modal Indonesia").strip(),
            source_organization=(item.get("source_organization") or "OJK / BEI").strip(),
            source_year=(item.get("source_year") or "2026").strip(),
            source_url=(item.get("source_url") or "").strip() or None,
            source_reference=(item.get("source_reference") or "Disusun dari literatur resmi pasar modal Indonesia.").strip(),
            verification_status=(item.get("verification_status") or "literature_based").strip(),
            verified_by=(item.get("verified_by") or "").strip() or None,
            verifier_role=(item.get("verifier_role") or "").strip() or None,
            verification_notes=(item.get("verification_notes") or "").strip() or None,
        )

        db.session.add(glossary)
        inserted_count += 1

    db.session.commit()
    print(f"Seed glosarium selesai. Inserted={inserted_count}")


def bootstrap():
    with app.app_context():
        db.create_all()
        print("Tabel dicek/dibuat: users, glossaries, stocks, stock_profiles, stock_fundamentals, stock_price_histories")

        ensure_glossary_schema()

        deleted = cleanup_old_logs()
        print(f"Cleanup log selesai, {deleted} data lama dihapus")

        seed_default_admin()
        seed_glossary_from_json()


if __name__ == "__main__":
    bootstrap()
    app.run(debug=True)