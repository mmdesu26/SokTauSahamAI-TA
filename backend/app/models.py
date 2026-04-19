# ===================================================================
# IMPORT STATEMENT / PERNYATAAN IMPOR
# ===================================================================
from app import db, bcrypt
# ^ Mengimpor dua objek dari package 'app' (file __init__.py di folder app):
#   - db     : objek SQLAlchemy (ORM / Object Relational Mapper) yang
#              digunakan untuk berinteraksi dengan database.
#              ORM = Object Relational Mapping, yaitu teknik yang mengubah
#              tabel database menjadi class Python (jadi baris = objek).
#   - bcrypt : objek Flask-Bcrypt untuk hashing password (enkripsi
#              satu arah agar password aman disimpan di database).


# ===================================================================
# KELAS (MODEL): User
# ===================================================================
# Ini adalah MODEL DATABASE bernama 'User'.
# MODEL = representasi tabel database dalam bentuk class Python.
# db.Model = kelas dasar (BASE CLASS) dari SQLAlchemy yang di-INHERIT
#            (diwariskan) agar kelas ini menjadi model database.
# Teknik ini disebut INHERITANCE (pewarisan) dalam OOP.
class User(db.Model):
    # -------------------------------------------------------------------
    # ATRIBUT KELAS SPESIAL: __tablename__
    # -------------------------------------------------------------------
    __tablename__ = "users"
    # ^ __tablename__ adalah ATRIBUT KHUSUS SQLAlchemy untuk menentukan
    #   nama TABEL di database. Jika tidak diisi, SQLAlchemy akan
    #   memakai nama default (otomatis). Di sini tabelnya bernama 'users'.

    # -------------------------------------------------------------------
    # DEFINISI KOLOM-KOLOM TABEL
    # -------------------------------------------------------------------
    # db.Column(...) = mendefinisikan sebuah KOLOM (field) di tabel.
    # Setiap atribut kelas yang pakai db.Column otomatis jadi kolom tabel.

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    # ^ KOLOM: id
    #   - Tipe: Integer (angka bulat)
    #   - primary_key=True  : kolom ini adalah PRIMARY KEY
    #     (kunci utama / unik, digunakan sebagai identitas baris).
    #   - autoincrement=True: nilai id otomatis bertambah 1 setiap baris baru.

    username = db.Column(db.String(50), unique=True, nullable=False)
    # ^ KOLOM: username
    #   - Tipe: String dengan panjang maks 50 karakter (VARCHAR(50)).
    #   - unique=True       : nilai harus UNIK (tidak boleh duplikat).
    #   - nullable=False    : tidak boleh NULL/kosong (WAJIB diisi).
    #   Ini adalah CONSTRAINT (batasan) di database.

    name = db.Column(db.String(100), nullable=False)
    # ^ KOLOM: name (nama lengkap user), maks 100 karakter, wajib diisi.

    password_hash = db.Column(db.String(255), nullable=False)
    # ^ KOLOM: password_hash
    #   Menyimpan HASIL HASH password (bukan password asli!).
    #   Alasan pakai 255 karakter: hasil bcrypt kira-kira 60 karakter,
    #   tapi 255 memberi ruang untuk algoritma hash lain di masa depan.

    # -------------------------------------------------------------------
    # KOLOM TIMESTAMP: created_at & updated_at (AUDIT FIELDS)
    # -------------------------------------------------------------------
    created_at = db.Column(
        db.DateTime, nullable=False, server_default=db.func.current_timestamp()
    )
    # ^ KOLOM: created_at (kapan data dibuat)
    #   - Tipe: DateTime
    #   - server_default=db.func.current_timestamp()
    #     => nilai default diisi oleh SERVER DATABASE (bukan Python),
    #     yaitu timestamp saat insert. Fungsi current_timestamp()
    #     adalah fungsi SQL bawaan database.

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )
    # ^ KOLOM: updated_at (kapan data terakhir diupdate)
    #   - onupdate=db.func.current_timestamp()
    #     => nilai otomatis diperbarui setiap kali baris ini di-UPDATE.

    # ===================================================================
    # METHOD INSTANCE: set_password
    # ===================================================================
    # Method ini punya parameter 'self' (bukan @staticmethod), artinya
    # method ini terikat ke INSTANCE (objek User tertentu).
    # self = referensi ke objek User yang memanggil method ini.
    def set_password(self, password):
        """
        FUNGSI: Meng-HASH password lalu menyimpannya ke kolom password_hash.
        PARAMETER:
            - password (str): password plain text dari user.
        """
        # bcrypt.generate_password_hash() = bikin hash dari password.
        # .decode("utf-8")                = konversi bytes ke string
        #                                    (karena bcrypt returns bytes).
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    # ===================================================================
    # METHOD INSTANCE: check_password
    # ===================================================================
    def check_password(self, password):
        """
        FUNGSI: Memverifikasi apakah password yang dimasukkan cocok
                dengan password_hash yang tersimpan.
        PARAMETER:
            - password (str): password plain text untuk dicek.
        RETURN:
            - bool: True jika cocok, False jika tidak.
        """
        # check_password_hash membandingkan password dengan hash.
        return bcrypt.check_password_hash(self.password_hash, password)

    # ===================================================================
    # METHOD SPESIAL / DUNDER METHOD: __repr__
    # ===================================================================
    # __repr__ = "representation", DUNDER METHOD (double underscore)
    # / MAGIC METHOD yang dipanggil otomatis saat objek di-print / di-debug.
    # Berguna untuk menampilkan objek dalam bentuk yang informatif.
    def __repr__(self):
        # Return string representasi, misal: <User johndoe>
        return f"<User {self.username}>"


# ===================================================================
# KELAS (MODEL): Glossary
# ===================================================================
# Model untuk tabel 'glossaries' (kamus istilah).
class Glossary(db.Model):
    __tablename__ = "glossaries"

    id = db.Column(db.Integer, primary_key=True)
    # ^ Primary key, tidak perlu autoincrement eksplisit
    #   (beberapa DB otomatis auto-increment untuk PK integer).

    term = db.Column(db.String(255), nullable=False, unique=True)
    # ^ Istilah/kata yang didefinisikan. Unik agar tidak duplikat.

    definition = db.Column(db.Text, nullable=False)
    # ^ Definisi dari istilah.
    #   Tipe Text = teks panjang tanpa batas karakter tertentu
    #   (beda dengan String(255) yang dibatasi).

    source_url = db.Column(db.Text, nullable=True)
    # ^ URL sumber referensi, opsional (nullable=True).

    verification_status = db.Column(
        db.String(30),
        nullable=False,
        default="literature_based"
    )
    # ^ KOLOM: verification_status (status verifikasi definisi).
    #   - default="literature_based"
    #     => nilai default diisi di sisi PYTHON/ORM saat objek dibuat
    #        (beda dengan server_default yang diisi database).
    #   Nilai contoh: "literature_based", "expert_verified", dll.

    verified_by = db.Column(db.String(150), nullable=True)
    # ^ Nama orang/entitas yang memverifikasi, opsional.

    created_at = db.Column(db.DateTime, default=db.func.now())
    # ^ default pakai db.func.now() (alias dari current_timestamp).

    updated_at = db.Column(
        db.DateTime,
        default=db.func.now(),
        onupdate=db.func.now()
    )

    # ===================================================================
    # METHOD INSTANCE: to_dict
    # ===================================================================
    # SERIALIZER method: mengubah objek model menjadi dict Python.
    # Berguna ketika data mau dikirim sebagai JSON response di API.
    def to_dict(self):
        """
        FUNGSI: Mengonversi objek Glossary menjadi dictionary.
                Key-nya diubah ke camelCase agar cocok dengan konvensi JavaScript.
        RETURN:
            - dict: representasi data glossary.
        """
        return {
            "id": self.id,
            "term": self.term,
            "definition": self.definition,
            "sourceUrl": self.source_url,               # snake_case -> camelCase
            "verificationStatus": self.verification_status,
            "verifiedBy": self.verified_by,
        }

    def __repr__(self):
        return f"<Glossary {self.term}>"


# ===================================================================
# KELAS (MODEL): Stock
# ===================================================================
# Model tabel 'stocks' untuk menyimpan data saham.
class Stock(db.Model):
    __tablename__ = "stocks"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    ticker = db.Column(db.String(10), unique=True, nullable=False)
    # ^ Kode ticker saham, contoh "BBCA", "BBRI". Unik + wajib.

    name = db.Column(db.String(150), nullable=False)
    # ^ Nama perusahaan, wajib.

    sector = db.Column(db.String(100), nullable=False)
    # ^ Sektor industri, wajib.

    price = db.Column(db.Numeric(15, 2), nullable=False, server_default="0")
    # ^ KOLOM: price (harga saham).
    #   - Tipe: Numeric(15, 2)
    #     => total 15 digit, 2 di antaranya desimal.
    #     Contoh: 9999999999999.99. Dipakai untuk HARGA KARENA PRESISI
    #     lebih baik daripada Float (Float bisa pembulatan tidak akurat).
    #   - server_default="0" => default di-set di database sebagai "0".

    change_percent = db.Column(db.String(20), nullable=False, server_default="0.00%")
    # ^ Persentase perubahan sebagai STRING (karena sudah include tanda %).
    #   Contoh nilai: "+1.25%", "-0.50%".

    status = db.Column(db.String(20), nullable=False, server_default="Active")
    # ^ Status saham: "Active", "Suspended", dsb.

    created_at = db.Column(
        db.DateTime, nullable=False, server_default=db.func.current_timestamp()
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )

    def to_dict(self):
        """Serialize objek Stock menjadi dict untuk response JSON."""
        return {
            "id": self.id,
            "ticker": self.ticker,
            "name": self.name,
            "sector": self.sector,
            # Konversi price (Numeric/Decimal) ke string agar presisi tidak hilang.
            # CONDITIONAL EXPRESSION: "0" jadi fallback jika price None.
            "price": str(self.price) if self.price is not None else "0",
            "change": self.change_percent,
            "status": self.status,
            # Format tanggal versi "manusia" (tanggal + jam).
            "lastUpdated": self.updated_at.strftime("%Y-%m-%d %H:%M")
            if self.updated_at
            else None,
            # Format ISO 8601 (standar internasional),
            # contoh: "2024-01-15T10:30:00". Biasa dipakai API.
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Stock {self.ticker}>"


# ===================================================================
# KELAS (MODEL): StockProfile
# ===================================================================
# Model tabel 'stock_profiles' untuk profil detail perusahaan.
# Punya RELASI ONE-TO-ONE dengan Stock (1 stock punya 1 profile).
class StockProfile(db.Model):
    __tablename__ = "stock_profiles"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # -------------------------------------------------------------------
    # FOREIGN KEY (Kunci Asing)
    # -------------------------------------------------------------------
    stock_id = db.Column(
        db.Integer, db.ForeignKey("stocks.id"), nullable=False, unique=True
    )
    # ^ KOLOM: stock_id
    #   - db.ForeignKey("stocks.id")
    #     => FOREIGN KEY / KUNCI ASING: kolom ini REFERENSI ke kolom 'id'
    #        di tabel 'stocks'. Menghubungkan tabel ini ke tabel stocks.
    #   - unique=True
    #     => tiap stock_id hanya muncul sekali (memastikan relasi ONE-TO-ONE).

    # Kolom data profile perusahaan:
    long_name = db.Column(db.String(200), nullable=False)  # Nama panjang
    short_name = db.Column(db.String(100), nullable=True)  # Nama pendek
    sector = db.Column(db.String(100), nullable=True)      # Sektor
    industry = db.Column(db.String(100), nullable=True)    # Industri
    long_business_summary = db.Column(db.Text, nullable=True)  # Deskripsi bisnis
    website = db.Column(db.String(255), nullable=True)     # URL website
    city = db.Column(db.String(100), nullable=True)        # Kota
    country = db.Column(db.String(100), nullable=True)     # Negara

    created_at = db.Column(
        db.DateTime, nullable=False, server_default=db.func.current_timestamp()
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )

    # -------------------------------------------------------------------
    # RELATIONSHIP (Relasi antar Model)
    # -------------------------------------------------------------------
    stock = db.relationship("Stock", backref=db.backref("profile", uselist=False))
    # ^ db.relationship = membuat RELASI antar model di level ORM
    #   (berbeda dengan ForeignKey yang di level database).
    #
    #   - "Stock"             : nama kelas yang direlasikan.
    #   - backref=db.backref("profile", uselist=False)
    #     => BACKREF = buat atribut BALIK di model Stock otomatis.
    #        Jadi dari objek Stock bisa akses: stock.profile
    #     => uselist=False  => artinya ONE-TO-ONE (bukan list, hanya 1 objek).
    #
    #   Contoh pemakaian:
    #     profile.stock   -> dapat objek Stock
    #     stock.profile   -> dapat objek StockProfile (karena backref)

    def to_dict(self):
        """Serialize profile ke dict."""
        return {
            "id": self.id,
            "stock_id": self.stock_id,
            "longName": self.long_name,
            "shortName": self.short_name,
            "sector": self.sector,
            "industry": self.industry,
            "longBusinessSummary": self.long_business_summary,
            "website": self.website,
            "city": self.city,
            "country": self.country,
        }


# ===================================================================
# KELAS (MODEL): StockFundamental
# ===================================================================
# Model tabel 'stock_fundamentals' untuk data fundamental saham
# (rasio-rasio keuangan). Juga ONE-TO-ONE dengan Stock.
class StockFundamental(db.Model):
    __tablename__ = "stock_fundamentals"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    stock_id = db.Column(
        db.Integer, db.ForeignKey("stocks.id"), nullable=False, unique=True
    )
    # ^ Foreign key ke stocks.id, unik untuk ONE-TO-ONE.

    # -------------------------------------------------------------------
    # KOLOM RASIO FUNDAMENTAL
    # -------------------------------------------------------------------
    # Tipe Float = angka desimal (presisi cukup untuk rasio).
    eps_ttm = db.Column(db.Float, nullable=True)
    # ^ EPS TTM (Earnings Per Share, Trailing Twelve Months)
    #   = laba bersih per lembar saham selama 12 bulan terakhir.

    per_ttm = db.Column(db.Float, nullable=True)
    # ^ PER TTM (Price to Earnings Ratio, Trailing Twelve Months)
    #   = harga saham / EPS. Rasio valuasi.

    pbv = db.Column(db.Float, nullable=True)
    # ^ PBV (Price to Book Value) = harga saham / nilai buku per lembar.

    roe = db.Column(db.Float, nullable=True)
    # ^ ROE (Return on Equity) = laba bersih / ekuitas. Profitabilitas.

    # -------------------------------------------------------------------
    # KOLOM DATA KEUANGAN (ABSOLUT, bukan rasio)
    # -------------------------------------------------------------------
    # Tipe BigInteger = integer besar (8 byte), cocok untuk nilai keuangan
    # yang bisa triliunan (Integer biasa hanya 4 byte, batas ~2 miliar).
    revenue = db.Column(db.BigInteger, nullable=True)         # Pendapatan
    net_income = db.Column(db.BigInteger, nullable=True)      # Laba bersih
    total_assets = db.Column(db.BigInteger, nullable=True)    # Total aset
    total_equity = db.Column(db.BigInteger, nullable=True)    # Total ekuitas

    # -------------------------------------------------------------------
    # KOLOM BENCHMARK (Pembanding Industri)
    # -------------------------------------------------------------------
    # Digunakan untuk membandingkan rasio saham ini vs rata-rata industri.
    benchmark_per = db.Column(db.Float, nullable=True)
    benchmark_pbv = db.Column(db.Float, nullable=True)
    benchmark_roe = db.Column(db.Float, nullable=True)
    benchmark_eps = db.Column(db.Float, nullable=True)

    created_at = db.Column(
        db.DateTime, nullable=False, server_default=db.func.current_timestamp()
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )

    # RELASI: ONE-TO-ONE ke Stock (stock.fundamental -> objek tunggal).
    stock = db.relationship("Stock", backref=db.backref("fundamental", uselist=False))

    def to_dict(self):
        """
        Serialize ke dict.
        Perhatikan: benchmark dikelompokkan jadi NESTED DICT (dict di dalam dict).
        """
        return {
            "id": self.id,
            "stock_id": self.stock_id,
            "epsTTM": self.eps_ttm,
            "perTTM": self.per_ttm,
            "pbv": self.pbv,
            "roe": self.roe,
            "revenue": self.revenue,
            "netIncome": self.net_income,
            "totalAssets": self.total_assets,
            "totalEquity": self.total_equity,
            # NESTED DICT: mengelompokkan benchmark dalam satu object.
            "benchmarks": {
                "per": self.benchmark_per,
                "pbv": self.benchmark_pbv,
                "roe": self.benchmark_roe,
                "eps": self.benchmark_eps,
            },
        }


# ===================================================================
# KELAS (MODEL): StockPriceHistory
# ===================================================================
# Model tabel 'stock_price_histories' untuk histori harga saham.
# Relasi ONE-TO-MANY dengan Stock (1 stock bisa punya banyak history).
class StockPriceHistory(db.Model):
    __tablename__ = "stock_price_histories"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    stock_id = db.Column(db.Integer, db.ForeignKey("stocks.id"), nullable=False)
    # ^ Foreign key ke stocks.id.
    #   PERHATIKAN: TIDAK ADA unique=True di sini.
    #   Artinya 1 stock_id bisa muncul di banyak baris (ONE-TO-MANY).

    timeframe = db.Column(db.String(10), nullable=False)
    # ^ Kerangka waktu: "7D", "1M", "1Y", dsb.

    label = db.Column(db.String(50), nullable=False)
    # ^ Label untuk tampilan di chart, contoh tanggal "2024-01-15".

    # -------------------------------------------------------------------
    # KOLOM OHLC (Open, High, Low, Close) - standar data saham
    # -------------------------------------------------------------------
    open_price = db.Column(db.Float, nullable=False)   # Harga pembukaan
    high_price = db.Column(db.Float, nullable=False)   # Harga tertinggi
    low_price = db.Column(db.Float, nullable=False)    # Harga terendah
    close_price = db.Column(db.Float, nullable=False)  # Harga penutupan

    sort_order = db.Column(db.Integer, nullable=False, default=0)
    # ^ Urutan tampilan di chart (dari awal ke akhir).

    created_at = db.Column(
        db.DateTime, nullable=False, server_default=db.func.current_timestamp()
    )

    # -------------------------------------------------------------------
    # RELASI ONE-TO-MANY
    # -------------------------------------------------------------------
    stock = db.relationship("Stock", backref=db.backref("price_histories", lazy=True))
    # ^ backref="price_histories" (plural, karena bisa banyak).
    #   Tidak ada uselist=False  => DEFAULT list (banyak objek).
    #   lazy=True = LAZY LOADING: data relasi TIDAK langsung di-load saat
    #   objek Stock diambil, tapi baru di-load saat pertama kali diakses.
    #   Ini hemat memori jika price_histories jarang dipakai.

    def to_dict(self):
        return {
            "id": self.id,
            "stock_id": self.stock_id,
            "timeframe": self.timeframe,
            "t": self.label,                # 't' = time label (singkatan)
            "open": self.open_price,
            "high": self.high_price,
            "low": self.low_price,
            "close": self.close_price,
            "sortOrder": self.sort_order,
        }


# ===================================================================
# KELAS (MODEL): SystemLog
# ===================================================================
# Model tabel 'system_logs' untuk mencatat AKTIVITAS/LOG sistem.
# Berguna untuk AUDIT TRAIL (jejak audit) — siapa melakukan apa kapan.
class SystemLog(db.Model):
    __tablename__ = "system_logs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    timestamp = db.Column(
        db.DateTime, nullable=False, server_default=db.func.current_timestamp()
    )
    # ^ Kapan log dicatat. Otomatis diisi DB.

    level = db.Column(db.String(20), nullable=False)
    # ^ Tingkat log: "INFO", "WARNING", "ERROR", "CRITICAL", dsb.

    source = db.Column(db.String(100), nullable=False)
    # ^ Sumber log: nama module/service yang menghasilkan log.

    message = db.Column(db.String(255), nullable=False)
    # ^ Pesan log singkat, wajib.

    details = db.Column(db.Text, nullable=True)
    # ^ Detail tambahan (bisa panjang, makanya pakai Text), opsional.

    # -------------------------------------------------------------------
    # RELASI KE TABEL USERS (opsional — log sistem bisa tanpa user)
    # -------------------------------------------------------------------
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    # ^ Foreign key ke users.id. nullable=True karena ada log sistem
    #   yang tidak terkait user spesifik (misal log dari scheduler).

    # Kolom AUDIT TRAIL (melacak aksi apa yang dilakukan):
    action_type = db.Column(db.String(50), nullable=True)
    # ^ Jenis aksi: "CREATE", "UPDATE", "DELETE", "LOGIN", dsb.

    entity_type = db.Column(db.String(50), nullable=True)
    # ^ Tipe entitas yang kena aksi: "Stock", "User", "Glossary", dsb.

    entity_id = db.Column(db.Integer, nullable=True)
    # ^ ID entitas yang kena aksi.

    ip_address = db.Column(db.String(50), nullable=True)
    # ^ IP address user (untuk security audit). Panjang 50 untuk IPv6.

    # RELASI ke User (MANY-TO-ONE: banyak log dari 1 user).
    user = db.relationship("User", backref=db.backref("logs", lazy=True))
    # ^ backref "logs" => dari objek User bisa akses user.logs
    #   (daftar semua log milik user tersebut).

    def to_dict(self):
        """Serialize log ke dict. Format timestamp lebih detail (termasuk detik)."""
        return {
            "id": self.id,
            # Format DateTime ke string "YYYY-MM-DD HH:MM:SS".
            # %S = detik (berbeda dari model lain yang hanya sampai %M).
            "timestamp": self.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            if self.timestamp
            else None,
            "level": self.level,
            "source": self.source,
            "message": self.message,
            "details": self.details,
            "user_id": self.user_id,
            "action_type": self.action_type,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            # Ambil username dari relasi user.
            # Jika user None (log sistem tanpa user), fallback "system".
            # Ini disebut RELATIONSHIP TRAVERSAL: akses data tabel lain
            # lewat object relationship (self.user.username).
            "username": self.user.username if self.user else "system",
        }

    def __repr__(self):
        return f"<SystemLog {self.id}>"