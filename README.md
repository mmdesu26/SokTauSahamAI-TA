# SokTauSaham

> Sistem Prediksi & Analisis Fundamental Saham IDX berbasis Machine Learning.
> Frontend: React + Tailwind. Backend: Flask + scikit-learn. Data: yfinance.

---

## 🚀 Cara Menjalankan

### Prasyarat
- Node.js 18+ (disarankan 20+)
- Python 3.10+
- MySQL / MariaDB (atau ganti ke SQLite via env `SQLALCHEMY_DATABASE_URI`)

### 1. Backend

```bash
cd backend/

# bikin virtual env
python -m venv venv
source venv/bin/activate      # Linux/Mac
venv\Scripts\activate         # Windows

# install dependency
pip install -r requirements.txt

# setup env (bikin file .env di folder backend/)
# contoh isi:
#   SECRET_KEY=ganti-secret-lo
#   JWT_SECRET_KEY=ganti-jwt-secret
#   JWT_EXPIRES_MINUTES=20
#   DB_USER=root
#   DB_PASSWORD=
#   DB_HOST=localhost
#   DB_PORT=3306
#   DB_NAME=soktausaham

# (opsional tapi dianjurkan) train model buat saham populer
python train_price_model.py --ticker BBCA
python train_price_model.py --ticker BBRI
# dst untuk ticker yang mau dipake

# jalanin server (auto-create tables + seed admin + seed glossary)
python run.py
```

Server jalan di `http://localhost:5000`.
Admin default: `username: admin` / `password: admin123` (ganti dulu pas pertama kali!).

### 2. Frontend

```bash
cd frontend/

# install dependency
npm install

# dev server (hot reload)
npm run dev
```

Buka `http://localhost:5173`.

### 3. Build Production (opsional)

```bash
cd frontend/
npm run build                 # hasilnya di folder dist/
npm run preview               # preview build production
```

---

## 🔄 Alur Kerja Sistem

### Alur user investor (normal flow)

```
User buka /stocks/BBCA
   │
   ▼
┌─────────────────┐      GET /api/stocks/BBCA/detail      ┌─────────────────┐
│   Frontend      │─────────────────────────────────────▶│    Backend      │
│ StockDetail.jsx │                                      │  routes/stocks  │
└─────────────────┘                                      └────────┬────────┘
                                                                  │
                                              ┌───────────────────┼───────────────────┐
                                              ▼                                       ▼
                                       ┌────────────┐                          ┌────────────┐
                                       │  Database  │                          │  yfinance  │
                                       │  (profil,  │                          │ (live OHLC,│
                                       │   cache)   │                          │ fundamental)│
                                       └────────────┘                          └────────────┘
                                              │                                       │
                                              └───────────────────┬───────────────────┘
                                                                  ▼
                                                          merge + translate
                                                                  │
                                                                  ▼
                                                            JSON response
```

### Alur prediksi AI (tab Prediksi)

```
User klik "Mulai Prediksi"
   │
   ▼
GET /api/stocks/BBCA/prediction
   │
   ▼
┌─────────────────────────────────────────────────────────┐
│ StockPredictionService (app/ml/inference.py)            │
│                                                         │
│  1. Cek artifact .pkl di app/ml/models/                 │
│     ├── ADA    → load_artifact()                        │
│     └── GAK ADA → train_runtime_model() (train on-the-fly)
│                                                         │
│  2. PriceFeatureBuilder → bangun 48 fitur terbaru       │
│     (15 lag_close + 15 lag_return + 15 lag_volume       │
│      + daily_range + open_close_change + volume_change) │
│                                                         │
│  3. Scaler transform → Random Forest predict return      │
│                     → Linear Regression predict return   │
│                     → ensemble (weighted avg)            │
│                                                         │
│  4. FundamentalScorer → EPS/ROE/PBV/PER rule scoring     │
│     → estimasi return 3 bulan + rekomendasi BUY/HOLD/SELL│
│                                                         │
└─────────────────────────────────────────────────────────┘
   │
   ▼
Response JSON: predicted_close_next_day, MAPE, fundamental_prediction
```

### Alur admin (CRUD)

```
Admin login (/admin/login) → POST /api/auth/login → dapet JWT
   │
   ▼
Token disimpan di localStorage (authSession)
   │
   ▼
Request ke endpoint admin → Authorization: Bearer {token}
(halaman: Dashboard, DataStocks, Logs, Glossary, ChangePw)
```

---

## 📁 Struktur Folder & Fungsi File

### Frontend

```
frontend/
├── public/
│   ├── logos/                 → Folder opsional buat logo saham lokal (.png).
│   │                            Kalau kosong, auto fallback ke Clearbit.
│   └── soktausaham.svg        → Logo aplikasi
│
├── src/
│   ├── main.jsx               → Entry point React, mount root ke <div id="root">
│   ├── index.css              → Tailwind base + CSS var custom (warna tema)
│   │
│   ├── lib/
│   │   ├── api.js             → Wrapper fetch ke backend. Auto inject JWT,
│   │   │                        auto logout kalau response 401.
│   │   └── utils.ts           → Helper cn() buat gabungin className Tailwind
│   │
│   ├── utils/
│   │   ├── authSession.js     → Simpen/ambil token JWT dari localStorage
│   │   ├── logoHelper.js      → Multi-source fallback logo perusahaan:
│   │   │                        manual → Clearbit → Google favicon → tebakan domain
│   │   └── stockLogoMap.js    → Map ticker → path logo lokal (opsional)
│   │
│   ├── hooks/
│   │   └── useAdminAutoLogout.js → Auto logout admin kalau idle terlalu lama
│   │
│   ├── routes/
│   │   ├── AppRoutes.jsx      → Definisi semua route (investor & admin)
│   │   └── ProtectedRoute.jsx → Guard buat halaman admin — redirect kalau gak login
│   │
│   ├── layouts/
│   │   ├── InvestorLayout.jsx → Wrapper halaman public (navbar + footer)
│   │   └── AdminLayout.jsx    → Wrapper halaman admin (sidebar + content)
│   │
│   ├── pages/
│   │   ├── investor/
│   │   │   ├── Home.jsx       → Landing page — hero + sekilas fitur
│   │   │   ├── Stocks.jsx     → List semua saham + search
│   │   │   ├── StockDetail.jsx→ ★ Halaman utama: profile, chart, prediksi AI,
│   │   │   │                    fundamental (EPS/PER/PBV/ROE + data mentah)
│   │   │   └── Glossary.jsx   → Kamus istilah saham
│   │   │
│   │   └── admin/
│   │       ├── Login.jsx      → Form login admin
│   │       ├── Dashboard.jsx  → Statistik sistem + ringkasan log
│   │       ├── DataStocks.jsx → CRUD data saham (add/edit/delete)
│   │       ├── Logs.jsx       → Riwayat log prediksi + external service
│   │       ├── Glossary.jsx   → CRUD istilah saham
│   │       └── ChangePw.jsx   → Ganti password admin
│   │
│   ├── components/
│   │   ├── Navbar.jsx         → Navigation bar investor
│   │   ├── AdminSidebar.jsx   → Sidebar menu admin
│   │   ├── ThemeProvider.jsx  → Context provider dark/light mode
│   │   ├── ThemeToggle.jsx    → Tombol toggle tema
│   │   ├── AppAlert.jsx       → Toast/alert component
│   │   ├── ConfirmModal.jsx   → Modal konfirmasi (delete, dll)
│   │   ├── StockCandleChart.jsx → Chart candlestick OHLC (SVG custom)
│   │   │
│   │   └── ui/                → Komponen UI reusable:
│   │       ├── Button.jsx     → Tombol (variant primary/outline/gradient)
│   │       ├── Card.jsx       → Card container
│   │       ├── Badge.jsx      → Badge label
│   │       ├── Spinner.jsx    → Loader muter
│   │       ├── StockLogo.jsx  → Logo saham auto (multi-source fallback)
│   │       └── Input.jsx      → Input text custom
│   │
│   └── assets/                → Asset statis (svg, dll)
│
├── dist/                      → Output build production (auto-gen, gak perlu commit)
├── index.html                 → HTML template Vite
├── vite.config.js             → Config Vite (alias @, proxy /api → backend)
├── tailwind.config.js         → Config Tailwind (custom color, dark mode)
├── components.json            → Config shadcn/ui
├── package.json               → Dependency + script npm
└── eslint.config.js           → Rules linter
```

### Backend

```
backend/
├── run.py                     → ★ Entry point. Bootstrap:
│                                - create_all() tabel
│                                - cleanup log lama
│                                - seed admin default
│                                - seed glossary dari glossary_seed.json
│                                - start Flask dev server
│
├── train_price_model.py       → Script CLI training model harga per ticker.
│                                Output: file .pkl di app/ml/models/
│                                Contoh: python train_price_model.py --ticker BBCA
│
├── run_backtesting.py         → Script CLI walk-forward backtesting.
│                                Contoh: python run_backtesting.py --ticker BBCA
│                                        --base-date 2025-12-20 --runs 5
│
├── glossary_seed.json         → Data awal istilah saham (diseed saat bootstrap)
├── requirements.txt           → Dependency Python
├── note.md                    → Catatan refactor struktur ML (internal)
│
└── app/
    ├── __init__.py            → ★ Flask app factory. Bind SQLAlchemy, Bcrypt,
    │                            Limiter, CORS. Register semua blueprint.
    │                            Healthcheck /api/health.
    │
    ├── config.py              → Config app dari .env (DB URL, JWT secret,
    │                            expiration, dll)
    │
    ├── models.py              → Model SQLAlchemy (tabel database):
    │                            - User              → akun admin
    │                            - Glossary          → istilah saham
    │                            - Stock             → master data saham
    │                            - StockProfile      → profil perusahaan
    │                            - StockFundamental  → rasio fundamental tersimpan
    │                            - StockPriceHistory → history harga per timeframe
    │                            - Log               → log prediksi & external service
    │
    ├── routes/                → ★ Flask Blueprints (endpoint API):
    │   ├── auth_routes.py     → /api/auth/*    — login, logout, me
    │   ├── admin_routes.py    → /api/admin/*   — CRUD saham, logs, dashboard stats
    │   ├── investor_routes.py → /api/investor/*— endpoint user (minimal)
    │   ├── glossary.py        → /api/glossary* — CRUD glosarium
    │   └── stocks.py          → /api/stocks/*  — list, detail, candlestick,
    │                                             prediction, fundamentals,
    │                                             market-overview
    │
    ├── ml/                    → ★ Modul Machine Learning (dipisah biar rapi):
    │   ├── __init__.py        → Export public API modul ml
    │   ├── config.py          → PriceModelConfig (ticker, lag_days, horizon, dll)
    │   ├── features.py        → PriceFeatureBuilder — bangun 48 fitur dari OHLCV
    │   ├── training.py        → PriceModelTrainer — train RF + LR,
    │   │                        evaluasi (MAPE, directional accuracy,
    │   │                        baseline persistence), simpan artifact .pkl
    │   ├── inference.py       → StockPredictionService — load/train artifact,
    │   │                        ensemble predict, return response lengkap
    │   ├── fundamental.py     → FundamentalScorer — rule-based scoring
    │   │                        EPS/ROE/PBV/PER → BUY/HOLD/SELL + return 3M
    │   └── models/            → Folder artifact .pkl hasil training
    │                            (auto-generated, gak perlu commit)
    │
    └── utils/                 → Helper-helper:
        ├── jwt_helper.py      → Encode/decode JWT token
        ├── auth_decorators.py → Decorator @admin_required buat proteksi route
        ├── logger.py          → Log prediksi & external service ke DB
        │                        + fungsi cleanup_old_logs
        ├── yfinance_helper.py → Wrapper yfinance (get_fundamentals, OHLC,
        │                        market overview, terjemahin symbol → .JK)
        ├── text_helper.py     → Terjemahin summary perusahaan Inggris → Indonesia
        │                        (pake deep-translator)
        └── ml_predictor.py    → Wrapper kompatibilitas buat import lama
                                 `from app.utils.ml_predictor import predict_stock_price`
                                 — delegate ke app/ml/inference.py
```

---

## 🔧 Alur Operasional ML

### Pertama kali setup

```bash
# 1. Train model buat saham yang diinginkan
python train_price_model.py --ticker BBCA
python train_price_model.py --ticker BBRI
# dst

# 2. Artifact tersimpan di app/ml/models/{ticker}.pkl
```

### Runtime behavior

- **Artifact ADA** → endpoint `/prediction` load artifact (cepat, ~500ms).
- **Artifact GAK ADA** → endpoint train on-the-fly (lambat, 5-15 detik pertama kali, hasil tetep di-cache ke pickle).

### Evaluasi model

Setiap training menyimpan metrik:
- **MAPE** — error rata-rata persentase
- **Baseline MAPE** — pakai naive persistence (prediksi besok = harga hari ini)
- **Directional accuracy** — proporsi arah naik/turun benar
- **Baseline directional accuracy** — baseline kelas mayoritas
- **model_beats_baseline** — flag boolean, model value-add atau cuma noise

### Walk-forward backtesting

```bash
python run_backtesting.py --ticker BBCA --base-date 2025-12-20 --runs 5
```

Geser jendela training mundur 5 kali, evaluasi di tiap window. Output: rata-rata + std MAPE dan directional accuracy — biar dapet gambaran variance performa model lintas waktu.

---

## 🌐 Endpoint API Utama

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/health` | Cek server + DB hidup |
| POST | `/api/auth/login` | Login admin → dapet JWT |
| GET | `/api/stocks` | List semua saham (+search, filter status) |
| GET | `/api/stocks/<ticker>/detail` | Detail lengkap (profile + fundamental + chart) |
| GET | `/api/stocks/<ticker>/candlestick` | Data OHLC chart (1D/7D/1M) |
| GET | `/api/stocks/<ticker>/prediction` | Prediksi AI harga besok + fundamental 3M |
| GET | `/api/stocks/<ticker>/fundamentals` | Rasio + raw data fundamental |
| GET | `/api/market-overview` | Ringkasan indeks IHSG, LQ45, dll |
| GET | `/api/glossary` | List istilah saham |
| GET | `/api/admin/dashboard` | Statistik sistem (butuh JWT admin) |

---

## 🧹 Maintenance

### Cleanup cache

```bash
# Backend: hapus cache Python
cd backend/
find . -name "__pycache__" -type d -exec rm -rf {} +
find . -name "*.pyc" -delete

# Frontend: hapus build + node_modules
cd frontend/
rm -rf dist/ node_modules/
npm install       # reinstall
```

### Re-train model

```bash
cd backend/
# hapus artifact lama
rm app/ml/models/*.pkl

# train ulang
python train_price_model.py --ticker BBCA
```

### Reset database

```bash
# masuk MySQL
DROP DATABASE soktausaham;
CREATE DATABASE soktausaham;

# jalanin run.py lagi — auto create tables + seed admin
python run.py
```

---

## 🎨 Warna Tema (biar konsisten kalau mau extend)

| Warna | Penggunaan |
|---|---|
| Hijau (emerald) | Harga naik, BUY, return positif |
| Merah | Harga turun, SELL, return negatif |
| Kuning (amber) | HOLD, warning |
| Biru (primary) | CTA, link, tombol utama |
| Abu-abu (slate) | Teks sekunder, border |

Convention warna IDX: **hijau = naik, merah = turun** (kebalikan dari US market).

---

## 📝 Catatan Pengembangan

- Backend route sengaja masih support **runtime training** biar backward compatible.
- Kalau mau full production, arahin route `/prediction` ke load-only mode (training cuma dari CLI).
- Cache fundamental bisa ditambahin di Redis (sekarang setiap request tarik fresh dari yfinance).
- Auth pake JWT stateless — token gak bisa direvoke sebelum expired. Untuk production serius, tambahin refresh token + blacklist di Redis.

---

## 🐛 Troubleshooting

**"Module not found: yfinance"**
→ `pip install -r requirements.txt`, pastiin venv aktif.

**"Frontend gak bisa hit backend (CORS)"**
→ Cek `app/__init__.py`, origins harus include port frontend (default `http://localhost:5173`).

**"Prediksi lama banget pertama kali"**
→ Normal — artifact belum ada, lagi training on-the-fly. Pre-train via `train_price_model.py` buat ngilangin ini.

**"Logo saham gak muncul"**
→ Folder `/public/logos/` boleh kosong, fallback Clearbit otomatis jalan. Kalau masih gak muncul, cek network tab browser — kemungkinan Clearbit block atau saham gak punya website di data yfinance.

**"DB connection error"**
→ Cek file `.env` — pastiin DB_HOST, DB_USER, DB_PASSWORD, DB_NAME bener + MySQL server nyala.
