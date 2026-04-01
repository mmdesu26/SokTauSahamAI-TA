# Gambaran Sistem SokTauSahamAI

Sistem ini adalah aplikasi web prediksi saham berbasis AI (Machine Learning) yang mengambil data dari yfinance. Sistem digunakan untuk menampilkan data saham, grafik candlestick, data fundamental, dan prediksi harga closing saham 1 bulan ke depan.

## 1. Arsitektur Sistem
Sistem terdiri dari 3 bagian utama:
- Backend
- Frontend
- Database

## 2. Alur Sistem
### Alur Admin
1. Admin login ke sistem
2. Admin menambahkan ticker saham
3. Backend memvalidasi ticker
4. Backend mengambil data saham dari yfinance
5. Data disimpan ke database
6. Aktivitas dicatat ke system log

### Alur User
1. User membuka halaman saham
2. User melihat data saham dan candlestick
3. User membuka data fundamental
4. User menekan tombol prediksi
5. Backend menjalankan machine learning
6. Hasil prediksi ditampilkan ke frontend

## 3. Sumber Data
Sumber data utama berasal dari yfinance, yaitu:
- harga historis saham
- harga closing saham
- profil perusahaan
- rasio fundamental: EPS, ROE, PBV, PER

## 4. Machine Learning Prediksi Saham
Fitur machine learning digunakan untuk memprediksi **harga closing saham 1 bulan ke depan**.

### Model yang digunakan
Sistem menggunakan metode ensemble learning, yaitu gabungan:
- Random Forest = 60%
- Linear Regression = 40%

### Fitur yang digunakan
Model hanya menggunakan rasio fundamental:
- EPS
- ROE
- PBV
- PER

### Target prediksi
Target yang diprediksi adalah:
- harga closing saham 1 bulan ke depan
- dalam implementasi dihitung sekitar 20 hari bursa ke depan

### Evaluasi model
Untuk mengukur performa model, digunakan:
- MSE
- RMSE
- MAE
- MAPE

Evaluasi dilakukan dengan metode:
- time-series holdout split

Artinya, data lama dipakai untuk training dan data terbaru dipakai untuk testing agar hasil evaluasi lebih valid.

### Output prediksi
Hasil yang ditampilkan:
- harga prediksi closing 1 bulan ke depan
- hasil prediksi Random Forest
- hasil prediksi Linear Regression
- bobot ensemble 60% RF dan 40% LR
- expected change (%)
- rekomendasi BUY / HOLD / SELL
- nilai MSE, RMSE, MAE, dan MAPE

### Catatan penting
Prediksi tidak disimpan permanen di database, tetapi dijalankan saat user menekan tombol prediksi. Dengan begitu, hasil prediksi selalu berdasarkan data terbaru yang tersedia.

## 5. Candlestick
Sistem tetap menampilkan grafik candlestick untuk membantu user membaca pergerakan harga saham.

## 6. Data Fundamental
Data fundamental yang ditampilkan:
- EPS
- ROE
- PBV
- PER

## 7. System Log
System log mencatat aktivitas seperti:
- login
- tambah saham
- ubah data
- hapus data
- proses prediksi
- error sistem

## 8. API Utama
Contoh endpoint utama:
- GET /api/stocks
- GET /api/stocks/{ticker}/detail
- GET /api/stocks/{ticker}/candlestick
- GET /api/stocks/{ticker}/prediction
- GET /api/stocks/{ticker}/fundamentals
- POST /api/admin/stocks
- PUT /api/admin/stocks/{id}
- DELETE /api/admin/stocks/{id}
- GET /api/admin/logs

## 9. Kesimpulan
Sistem SokTauSahamAI adalah aplikasi prediksi saham berbasis web yang menggabungkan:
- data pasar dari yfinance
- data fundamental perusahaan
- machine learning ensemble Random Forest dan Linear Regression
- visualisasi candlestick
- system logging

Fokus utama sistem adalah memprediksi harga closing saham 1 bulan ke depan menggunakan rasio fundamental EPS, ROE, PBV, dan PER.