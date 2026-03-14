from app import create_app, db, bcrypt
from app.models import User, Glossary, Stock, StockProfile, StockFundamental, StockPriceHistory

app = create_app()


def create_admin_account():
    with app.app_context():
        db.create_all()
        print("Tabel dicek/dibuat: users, glossaries, stocks, stock_profiles, stock_fundamentals, stock_price_histories")

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

        # =========================
        # Seed saham
        # =========================
        stock_seed = [
            {
                "ticker": "BBCA",
                "name": "Bank Central Asia Tbk",
                "sector": "Finance",
                "price": 9450,
                "change_percent": "+2.34%",
                "volume": "125.3M",
                "status": "Active",
            },
            {
                "ticker": "BMRI",
                "name": "Bank Mandiri (Persero) Tbk",
                "sector": "Finance",
                "price": 6775,
                "change_percent": "+1.87%",
                "volume": "89.2M",
                "status": "Active",
            },
            {
                "ticker": "ASII",
                "name": "Astra International Tbk",
                "sector": "Automotive",
                "price": 8200,
                "change_percent": "-0.45%",
                "volume": "45.1M",
                "status": "Active",
            },
            {
                "ticker": "TLKM",
                "name": "Telekomunikasi Indonesia Tbk",
                "sector": "Telecom",
                "price": 2895,
                "change_percent": "+0.98%",
                "volume": "234.5M",
                "status": "Inactive",
            },
            {
                "ticker": "UNVR",
                "name": "Unilever Indonesia Tbk",
                "sector": "Consumer Goods",
                "price": 2540,
                "change_percent": "-1.23%",
                "volume": "12.4M",
                "status": "Active",
            },
        ]

        for item in stock_seed:
            exists = Stock.query.filter_by(ticker=item["ticker"]).first()
            if not exists:
                db.session.add(Stock(**item))

        db.session.commit()
        print("Seed saham selesai dicek.")

        # =========================
        # Seed detail stock: BBCA
        # =========================
        bbca = Stock.query.filter_by(ticker="BBCA").first()

        if bbca:
            profile = StockProfile.query.filter_by(stock_id=bbca.id).first()
            if not profile:
                profile = StockProfile(
                    stock_id=bbca.id,
                    long_name="PT Bank Central Asia Tbk",
                    short_name="BBCA",
                    sector="Finance",
                    industry="Perbankan",
                    long_business_summary="Perusahaan bergerak di bidang jasa perbankan dan layanan keuangan di Indonesia. Fokus utama mencakup penghimpunan dana masyarakat, penyaluran kredit, dan layanan digital banking.",
                    website="https://www.bca.co.id",
                    city="Jakarta",
                    country="Indonesia",
                )
                db.session.add(profile)

            fundamental = StockFundamental.query.filter_by(stock_id=bbca.id).first()
            if not fundamental:
                fundamental = StockFundamental(
                    stock_id=bbca.id,
                    eps_ttm=665,
                    per_ttm=14.25,
                    pbv=1.85,
                    roe=18.5,
                    revenue=125500000000000,
                    net_income=38200000000000,
                    total_assets=1650000000000000,
                    total_equity=206000000000000,
                    benchmark_per=15.5,
                    benchmark_pbv=2.1,
                    benchmark_roe=16.2,
                    benchmark_eps=620,
                )
                db.session.add(fundamental)

            existing_1d = StockPriceHistory.query.filter_by(stock_id=bbca.id, timeframe="1D").first()
            if not existing_1d:
                candle_1d = [
                    ("09:00", 395, 398, 392, 393),
                    ("09:15", 393, 405, 392, 403),
                    ("09:30", 403, 410, 401, 408),
                    ("09:45", 408, 416, 407, 414),
                    ("10:00", 414, 420, 405, 418),
                    ("10:15", 418, 432, 416, 430),
                    ("10:30", 430, 440, 428, 438),
                    ("11:00", 392, 396, 390, 395),
                    ("11:15", 395, 405, 394, 403),
                    ("11:30", 403, 412, 401, 410),
                    ("11:45", 410, 418, 408, 414),
                    ("12:00", 414, 430, 412, 428),
                    ("12:15", 428, 442, 426, 440),
                    ("13:00", 398, 402, 395, 401),
                    ("13:15", 401, 410, 399, 408),
                    ("13:30", 408, 418, 406, 412),
                    ("13:45", 412, 420, 409, 418),
                    ("14:00", 418, 436, 415, 434),
                    ("14:15", 434, 448, 432, 446),
                    ("16:00", 400, 410, 398, 407),
                ]

                for idx, row in enumerate(candle_1d):
                    db.session.add(
                        StockPriceHistory(
                            stock_id=bbca.id,
                            timeframe="1D",
                            label=row[0],
                            open_price=row[1],
                            high_price=row[2],
                            low_price=row[3],
                            close_price=row[4],
                            sort_order=idx + 1,
                        )
                    )

            existing_1w = StockPriceHistory.query.filter_by(stock_id=bbca.id, timeframe="1W").first()
            if not existing_1w:
                candle_1w = [
                    ("D1", 400, 410, 395, 405),
                    ("D2", 405, 415, 402, 412),
                    ("D3", 412, 420, 408, 418),
                    ("D4", 418, 430, 415, 425),
                    ("D5", 425, 438, 420, 432),
                    ("D6", 432, 442, 428, 438),
                    ("D7", 438, 448, 434, 446),
                ]

                for idx, row in enumerate(candle_1w):
                    db.session.add(
                        StockPriceHistory(
                            stock_id=bbca.id,
                            timeframe="1W",
                            label=row[0],
                            open_price=row[1],
                            high_price=row[2],
                            low_price=row[3],
                            close_price=row[4],
                            sort_order=idx + 1,
                        )
                    )

        db.session.commit()
        print("Seed stock detail selesai dicek.")


if __name__ == "__main__":
    create_admin_account()
    app.run(debug=True)