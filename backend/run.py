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

    if "source_url" not in existing_columns:
        alter_statements.append(
            "ALTER TABLE glossaries ADD COLUMN source_url TEXT NULL"
        )

    if "verification_status" not in existing_columns:
        alter_statements.append(
            "ALTER TABLE glossaries ADD COLUMN verification_status VARCHAR(30) NOT NULL DEFAULT 'literature_based'"
        )

    if "verified_by" not in existing_columns:
        alter_statements.append(
            "ALTER TABLE glossaries ADD COLUMN verified_by VARCHAR(150) NULL"
        )

    with db.engine.begin() as connection:
        for sql in alter_statements:
            connection.execute(text(sql))

        connection.execute(
            text(
                """
                UPDATE glossaries
                SET
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
            password_hash=hashed_password,
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
            source_url=(item.get("source_url") or "").strip() or None,
            verification_status=(
                item.get("verification_status") or "literature_based"
            ).strip(),
            verified_by=(item.get("verified_by") or "").strip() or None,
        )

        db.session.add(glossary)
        inserted_count += 1

    db.session.commit()
    print(f"Seed glosarium selesai. Inserted={inserted_count}")


def bootstrap():
    with app.app_context():
        db.create_all()
        print(
            "Tabel dicek/dibuat: users, glossaries, stocks, stock_profiles, stock_fundamentals, stock_price_histories"
        )

        ensure_glossary_schema()

        deleted = cleanup_old_logs()
        print(f"Cleanup log selesai, {deleted} data lama dihapus")

        seed_default_admin()
        seed_glossary_from_json()


if __name__ == "__main__":
    bootstrap()
    app.run(debug=True)