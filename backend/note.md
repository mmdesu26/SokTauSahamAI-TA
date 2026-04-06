# Gambaran Sistem SokTauSahamAI

SokTauSahamAI adalah web app analisis saham yang combine data market dari yfinance + machine learning sederhana.

Fungsinya bukan cuma nampilin data saham, tapi juga kasih:
- prediksi harga closing **besok (next trading day)**
- insight fundamental untuk **3 bulan ke depan**

---

## 1. Arsitektur Sistem

Sistem dibagi jadi 3 layer utama:
- Backend (Python / API / ML logic)
- Frontend (React UI)
- Database (nyimpen ticker & log)

---

## 2. Alur Sistem

### Alur Admin
1. Admin login
2. Admin add ticker saham
3. Backend validasi ticker ke yfinance
4. Data basic disimpan ke database
5. Aktivitas dicatat ke system log

---

### Alur User
1. User buka halaman detail saham
2. Sistem fetch:
   - profil perusahaan
   - candlestick
3. User bisa buka:
   - tab deskripsi
   - tab fundamental
4. User klik tombol **Prediksi**
5. Backend jalanin model ML (on demand)
6. Hasil dikirim ke frontend dan ditampilkan

---

## 3. Sumber Data

Semua data diambil dari **yfinance**:
- harga historis (daily)
- harga intraday (candlestick)
- profil perusahaan
- fundamental:
  - EPS
  - ROE
  - PBV
  - PER

---

## 4. Machine Learning (Model Harga)

### Tujuan
Prediksi:
- **harga closing 1 hari ke depan (next trading day)**

---

### Cara Kerja Model

Model tidak langsung prediksi harga, tapi:

1. model belajar return (persentase perubahan harga)
2. hasil return dikonversi lagi ke harga

---

### Data yang dipakai
- closing price historis
- lag data (close 1–10 hari sebelumnya)

Tidak pakai:
- indikator teknikal (RSI, MACD, dll)
- fundamental

---

### Model yang digunakan
- Random Forest
- Linear Regression

---

### Cara gabung (ensemble)

Tidak fixed lagi.

Sekarang:
- bobot dihitung dari performa (RMSE)
- model lebih akurat → bobot lebih besar

---

### Output Model Harga

Yang dihasilkan:
- prediksi closing besok
- hasil RF
- hasil LR
- bobot masing-masing model
- expected change (%)
- rekomendasi harga (BUY / HOLD / SELL)

---

## 5. Evaluasi Model

Model dievaluasi pakai data historis

### Metode
- time-series split (bukan random)
  - data lama → training
  - data terbaru → testing

---

### Metrik
- RMSE → selisih rata-rata dalam rupiah
- MAPE → selisih rata-rata dalam persen

---

### Catatan
- RMSE dihitung dari selisih harga prediksi vs harga asli
- bukan dari 1 prediksi, tapi dari seluruh data test

---

## 6. Model Fundamental (Terpisah)

Model fundamental tidak dipakai untuk prediksi harga harian

Dipakai untuk:
- estimasi return 3 bulan
- arah (naik / turun)
- rekomendasi

---

### Input
- EPS
- ROE
- PBV
- PER

---

### Cara kerja
- rule-based scoring (bukan ML training)
- tiap rasio dikasih skor
- total skor → jadi estimasi return %

---

### Output
- return 3 bulan (%)
- arah (Naik / Turun)
- rekomendasi (BUY / HOLD / SELL)

---

## 7. Candlestick

Grafik candlestick:
- pakai data intraday dari yfinance
- hanya untuk visualisasi
- bukan input ke model

---

## 8. Perbedaan Harga (Penting)

Ada 2 jenis harga:

### Close data model
- harga penutupan harian terakhir yang sudah completed
- dipakai model sebagai acuan

### Harga chart
- dari candlestick (intraday)
- bisa beda karena lebih update

---

## 9. Prediksi On-Demand

Prediksi:
- tidak disimpan di database
- dihitung saat user klik tombol

Tujuannya:
- selalu pakai data terbaru
- tidak stale

---

## 10. API Utama

Endpoint utama:

- GET /api/stocks
- GET /api/stocks/{ticker}/detail
- GET /api/stocks/{ticker}/candlestick
- GET /api/stocks/{ticker}/prediction
- GET /api/stocks/{ticker}/fundamentals

Admin:
- POST /api/admin/stocks
- PUT /api/admin/stocks/{id}
- DELETE /api/admin/stocks/{id}
- GET /api/admin/logs

---

## 11. System Log

System log nyimpen:
- login
- tambah saham
- update
- delete
- prediksi
- error

---

## 12. Kesimpulan

SokTauSahamAI adalah web app analisis saham yang combine:

- data market dari yfinance
- model harga (RF + LR)
- model fundamental (rule-based)
- candlestick visualization

Fokus utama:
- prediksi harga **besok**
- insight arah **3 bulan ke depan**

Model dibuat simple, explainable, dan tidak pakai indikator teknikal kompleks.


Sistem tahu harga terakhir itu sudah completed karena dia cuma ambil data sebelum hari ini. Jadi selama hari ini masih berjalan atau bahkan sudah tutup, sistem tetap pakai hari sebelumnya untuk memastikan datanya benar-benar final dan tidak berubah lagi.