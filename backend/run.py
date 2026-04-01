from app import create_app, db, bcrypt  # ambil app, db, bcrypt
from app.models import User, Glossary  # model yg dipakai
from app.utils.logger import cleanup_old_logs  # fungsi buat hapus log lama

app = create_app()


def create_admin_account():
    with app.app_context():
        db.create_all()  # cek / bikin tabel kalau belum ada
        print("Tabel dicek/dibuat: users, glossaries, stocks, stock_profiles, stock_fundamentals, stock_price_histories")

        # hapus log lama pas app nyala
        deleted = cleanup_old_logs()
        print(f"Cleanup log selesai, {deleted} data lama dihapus")

        # =========================
        # Seed admin default
        # =========================
        admin_username = "admin"
        admin = User.query.filter_by(username=admin_username).first()

        if not admin:
            hashed_password = bcrypt.generate_password_hash("admin123").decode("utf-8")
            admin_user = User(
                username=admin_username,
                name="Administrator",
                password_hash=hashed_password
            )
            db.session.add(admin_user)
            db.session.commit()
            print("Admin default berhasil dibuat: username 'admin', password 'admin123'")
        else:
            print("Admin default sudah ada.")

        # =========================
        # Seed glosarium
        # =========================
        glossary_seed = [
            {
                "term": "PER (Price-to-Earnings Ratio)",
                "definition": "Rasio perbandingan harga saham terhadap laba per lembar saham. Semakin rendah PER, semakin murah valuasi saham."
            },
            {
                "term": "PBV (Price-to-Book Value)",
                "definition": "Rasio perbandingan harga saham terhadap nilai aset bersih per lembar. Digunakan untuk menilai saham value."
            },
            {
                "term": "ROE (Return on Equity)",
                "definition": "Rasio profitabilitas yang menunjukkan seberapa efisien perusahaan menggunakan modal pemegang saham untuk menghasilkan laba."
            },
            {
                "term": "EPS (Earnings Per Share)",
                "definition": "Laba bersih perusahaan dibagi jumlah saham beredar. Menunjukkan berapa banyak keuntungan yang diperoleh setiap lembar saham."
            },
            {
                "term": "IHSG (Indeks Harga Saham Gabungan)",
                "definition": "Indeks utama bursa saham Indonesia yang mencakup semua saham tercatat di BEI."
            },
            {
                "term": "Bullish",
                "definition": "Kondisi pasar atau saham yang diperkirakan akan naik harganya dalam waktu dekat."
            },
            {
                "term": "Bearish",
                "definition": "Kondisi pasar atau saham yang diperkirakan akan turun harganya dalam waktu dekat."
            },
        ]

        for item in glossary_seed:
            exists = Glossary.query.filter_by(term=item["term"]).first()
            if not exists:
                db.session.add(
                    Glossary(
                        term=item["term"],
                        definition=item["definition"]
                    )
                )

        db.session.commit()
        print("Seed glosarium selesai dicek.")


if __name__ == "__main__":
    create_admin_account()
    app.run(debug=True)