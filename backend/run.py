# Import json untuk membaca file seed data glossary dari file JSON
import json

# Import os untuk manipulasi path file
import os

# Import factory app, database, dan bcrypt dari app
from app import create_app, db, bcrypt

# Import model yang dipakai saat bootstrap
from app.models import User, Glossary

# Import fungsi cleanup log lama
from app.utils.logger import cleanup_old_logs

# Membuat instance Flask app dari factory
app = create_app()


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