Jadi intinya sistem ini tuh aplikasi prediksi saham pake AI (Machine Learning) yang datanya diambil langsung dari API yfinance, jadi real-time (karena saat klik button langsung jalanin prediksi ML nya) & gak ngasal.

🧠 GAMBARAN SISTEMNYA

Sistem ini punya 3 bagian utama:
Backend (otak sistem)
Frontend (tampilan user)
Database (penyimpanan data)

⚙️ BACKEND (DALAMANNYA GIMANA)
🤖 1. Mesin AI (Prediksi Saham)
Modelnya gabungan (ensemble):
Random Forest (60%)
Linear Regression (40%)
Data yang dipake:
OHLCV (Open, High, Low, Close, Volume)
Indikator teknikal:
MA
RSI
MACD
Bollinger Bands
Output:
Prediksi harga 1 bulan ke depan
Nilai akurasi (RMSE / MAPE)

📌 Catatan:

AI nya ini on-demand, jadi cuma jalan pas user klik tombol “Prediksi”, bukan disimpen di database (biar ringan).

📡 2. Ambil Data (yfinance)
Narik data:
Harga saham historis
Profil perusahaan
Data fundamental (EPS, ROE, PBV, dll)

📌 Jadi:

Admin gak perlu input manual ribet, cukup ticker doang.

🗃️ 3. Database

Data yang disimpen:

Data saham (ticker, nama, sektor, harga)
Profil perusahaan
Data fundamental
Riwayat harga (candlestick)

📌 Khusus harga:

Disimpen intraday (per jam / 1h)
Diambil dari 7 hari terakhir
Dipake buat grafik
🧑‍💻 ADMIN SYSTEM (CRUD SAHAM)
➕ Tambah Saham

Alurnya:

Admin input ticker (BBCA)
→ Backend cek validasi
→ Fetch dari yfinance
→ Ambil:
   - nama perusahaan
   - sektor
   - harga
   - fundamental
→ Ambil data candlestick per jam
→ Simpan ke database
→ Log ke system log

📌 Jadi:

Admin cuma isi ticker + status, sisanya auto.

✏️ Update
Cuma bisa ubah status (Active / Inactive)
Ticker gak bisa diubah
🗑️ Delete
Hapus:
harga
fundamental
profil
data saham
Semua kehapus sekalian (clean)
📊 FRONTEND (YANG DILIHAT USER)
📈 Grafik Candlestick
Data dari database
Bentuk: per jam (intraday)
Bisa zoom & geser

📌 Bedanya:

Dulu harian → sekarang per jam (lebih detail)

🔮 Prediksi Saham

Flow:

User klik "Prediksi"
→ Backend jalanin ML
→ Hasil muncul:
   - harga prediksi
   - % naik/turun
   - rekomendasi (BUY / HOLD / SELL)

📌 Penting:

Hasilnya sementara (gak disimpen), refresh = ilang

📊 Fundamental
Data langsung dari yfinance
Nampilin:
EPS
ROE
dll
Ada interpretasi:
Murah / Wajar / Mahal
🔄 ALUR SISTEM
Admin input saham → masuk database

User buka web:
→ lihat grafik (dari DB)
→ klik prediksi (AI jalan real-time)
→ klik fundamental (ambil dari API)
🕯️ CANDLESTICK (INTRADAY)

Struktur data:

waktu: 09:00, 10:00, dst
open, high, low, close

Flow:

Fetch dari yfinance (1h)
→ simpan ke DB
→ frontend ambil
→ ditampilin di chart
📜 SYSTEM LOG (INI PENTING BANGET BUAT SKRIPSI)

Semua aktivitas ke-track:

CRUD saham
Prediksi AI
Login user

Contoh:

✅ sukses create saham
❌ gagal prediksi
⚠️ warning data kurang

Isi log:

waktu
user
aksi (CREATE, DELETE, PREDICT)
status (success/error)
detail error (kalo ada)

📌 Jadi:

Bisa buat monitoring + bahan evaluasi sistem

🔌 API (INTINYA)

Contoh:

GET /admin/stocks → ambil data saham
POST /admin/stocks → tambah saham
DELETE /admin/stocks/:id → hapus
GET /stocks/:ticker/candlestick → grafik
GET /admin/logs → lihat log
🚀 KELEBIHAN SISTEM
✔️ Input simpel (cukup ticker)
✔️ Data real-time (yfinance)
✔️ Grafik lebih detail (per jam)
✔️ AI udah ensemble (lebih akurat)
✔️ Semua aktivitas ke-log
✔️ Ada tracking error (debug gampang)
⚠️ CATATAN PENTING
Prediksi gak disimpen → hemat database
Data grafik dari DB → biar cepat
Fundamental → langsung API (live)
Log → penting buat pengujian & evaluasi
🧠 INTINYA BANGET

Sistem ini tuh kombinasi:

Data real-time (yfinance)
AI prediksi
visualisasi grafik
monitoring via log