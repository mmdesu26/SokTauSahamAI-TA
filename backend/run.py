# Import json untuk membaca file seed data glossary dari file JSON
import json

# Import os untuk manipulasi path file
import os

# Import inspect dan text dari SQLAlchemy
# - inspect: untuk mengecek struktur tabel database
# - text: untuk menjalankan raw SQL
from sqlalchemy import inspect, text

# Import factory app, database, dan bcrypt dari app
from app import create_app, db, bcrypt

# Import model yang dipakai saat bootstrap
from app.models import User, Glossary

# Import fungsi cleanup log lama
from app.utils.logger import cleanup_old_logs

# Membuat instance Flask app dari factory
app = create_app()


def ensure_glossary_schema():
    """
    Mengecek apakah tabel glossaries sudah memiliki kolom yang dibutuhkan.
    Jika ada kolom yang belum ada, tambahkan secara manual memakai ALTER TABLE.

    Tujuan:
    - menjaga kompatibilitas schema lama
    - semacam migrasi ringan tanpa Alembic
    """
    # Membaca metadata schema database
    inspector = inspect(db.engine)

    # Jika tabel glossaries belum ada, tidak perlu lanjut
    if "glossaries" not in inspector.get_table_names():
        return

    # Ambil semua nama kolom yang sudah ada di tabel glossaries
    existing_columns = {col["name"] for col in inspector.get_columns("glossaries")}

    # List SQL ALTER TABLE yang perlu dijalankan
    alter_statements = []

    # Jika kolom source_url belum ada, tambahkan
    if "source_url" not in existing_columns:
        alter_statements.append(
            "ALTER TABLE glossaries ADD COLUMN source_url TEXT NULL"
        )

    # Jika kolom verification_status belum ada, tambahkan
    if "verification_status" not in existing_columns:
        alter_statements.append(
            "ALTER TABLE glossaries ADD COLUMN verification_status VARCHAR(30) NOT NULL DEFAULT 'literature_based'"
        )

    # Jika kolom verified_by belum ada, tambahkan
    if "verified_by" not in existing_columns:
        alter_statements.append(
            "ALTER TABLE glossaries ADD COLUMN verified_by VARCHAR(150) NULL"
        )

    # Jalankan perubahan schema dalam transaction
    with db.engine.begin() as connection:
        # Eksekusi semua ALTER TABLE yang diperlukan
        for sql in alter_statements:
            connection.execute(text(sql))

        # Pastikan verification_status yang kosong/null diisi default
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
    """
    Membaca file glossary_seed.json yang berada di folder yang sama
    dengan file bootstrap ini.

    Return:
    - list of glossary seed jika sukses
    - [] jika file tidak ada / gagal dibaca / format salah
    """
    # Bentuk path ke file glossary_seed.json
    json_path = os.path.join(os.path.dirname(__file__), "glossary_seed.json")

    # Jika file tidak ditemukan
    if not os.path.exists(json_path):
        print(f"File glossary_seed.json tidak ditemukan: {json_path}")
        return []

    try:
        # Buka file JSON dengan encoding utf-8
        with open(json_path, "r", encoding="utf-8") as file:
            data = json.load(file)

        # Pastikan isi JSON berupa list
        return data if isinstance(data, list) else []

    except Exception as error:
        # Jika gagal baca / parse JSON
        print(f"Gagal membaca glossary_seed.json: {error}")
        return []


def seed_default_admin():
    """
    Membuat akun admin default jika belum ada.

    Default:
    - username: admin
    - password: admin123
    """
    # Cari apakah user admin sudah ada
    admin = User.query.filter_by(username="admin").first()

    # Jika belum ada, buat user admin baru
    if not admin:
        # Hash password memakai bcrypt
        hashed_password = bcrypt.generate_password_hash("admin123").decode("utf-8")

        # Buat object User
        admin_user = User(
            username="admin",
            name="Administrator",
            password_hash=hashed_password,
        )

        # Simpan ke database
        db.session.add(admin_user)
        db.session.commit()

        print("Admin default berhasil dibuat: username 'admin', password 'admin123'")
    else:
        print("Admin default sudah ada.")


def seed_glossary_from_json():
    """
    Mengisi tabel glossary dari file glossary_seed.json
    jika data belum ada.
    """
    # Ambil data seed glossary dari file JSON
    glossary_seed = load_glossary_seed()

    # Jika file kosong / gagal dibaca
    if not glossary_seed:
        print("Seed glosarium dilewati karena JSON kosong.")
        return

    # Counter jumlah data yang berhasil dimasukkan
    inserted_count = 0

    # Loop setiap item glossary dari JSON
    for item in glossary_seed:
        # Ambil term dan definition, lalu trim spasi
        term = (item.get("term") or "").strip()
        definition = (item.get("definition") or "").strip()

        # Lewati jika data inti kosong
        if not term or not definition:
            continue

        # Cek apakah term sudah ada di database
        exists = Glossary.query.filter_by(term=term).first()
        if exists:
            continue

        # Buat object Glossary baru
        glossary = Glossary(
            term=term,
            definition=definition,
            source_url=(item.get("source_url") or "").strip() or None,
            verification_status=(
                item.get("verification_status") or "literature_based"
            ).strip(),
            verified_by=(item.get("verified_by") or "").strip() or None,
        )

        # Tambahkan ke session
        db.session.add(glossary)
        inserted_count += 1

    # Commit semua data yang baru ditambahkan
    db.session.commit()

    print(f"Seed glosarium selesai. Inserted={inserted_count}")


def bootstrap():
    """
    Proses bootstrap aplikasi.

    Yang dilakukan:
    1. Membuat semua tabel jika belum ada
    2. Mengecek / memperbarui schema glossary
    3. Membersihkan log lama
    4. Membuat admin default
    5. Mengisi glossary seed
    """
    # Jalankan semua proses di dalam app context Flask
    with app.app_context():
        # Membuat semua tabel berdasarkan model
        db.create_all()

        print(
            "Tabel dicek/dibuat: users, glossaries, stocks, stock_profiles, stock_fundamentals, stock_price_histories"
        )

        # Pastikan schema glossary lengkap
        ensure_glossary_schema()

        # Hapus log lama (> 6 bulan)
        deleted = cleanup_old_logs()
        print(f"Cleanup log selesai, {deleted} data lama dihapus")

        # Buat admin default jika belum ada
        seed_default_admin()

        # Isi glossary dari file JSON
        seed_glossary_from_json()


# Jika file ini dijalankan langsung
if __name__ == "__main__":
    # Jalankan proses bootstrap terlebih dahulu
    bootstrap()

    # Jalankan Flask app dalam mode debug
    app.run(debug=True)