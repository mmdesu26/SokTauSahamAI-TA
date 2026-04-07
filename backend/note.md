# NOTE FULLSTACK - SOKTAU SAHAM AI

## overview dikit biar ga lupa

ini project fullstack:

* backend → flask (API + logic + model handling)
* frontend → react (UI + interaksi user)

tujuan:
→ bantu user prediksi harga saham (bukan buat jadi cenayang 😅, tapi decision support aja)

flow besar:
user → frontend → API backend → proses (model + data) → balik → ditampilin

---

## gambaran flow real (end to end)

1. user login
2. user pilih saham / trigger prediksi
3. frontend hit endpoint:

   ```
   /api/investor/...
   ```
4. backend:

   * ambil data saham (historical)
   * ambil close terakhir
   * masukin ke model
   * generate prediksi
5. hasil dikirim ke frontend
6. frontend render + kasih penjelasan

---

## 🔥 CORE LOGIC PALING PENTING (JANGAN SAMPE LUPA)

### model itu ga ngerti waktu

model cuma tau:
→ input terakhir yg dikasih

jadi:
✅ kalo input valid → hasil lebih make sense
❌ kalo input ngawur → hasil ikut ngawur

---

## ⚠️ MASALAH UTAMA: DATA CLOSE

close price itu:
→ cuma valid setelah market tutup

jadi:

### kondisi:

* pagi / siang → market masih jalan ❌
* sore (setelah tutup) → baru valid ✅

---

### contoh real biar nempel

senin:

* jam 11 → harga masih berubah ❌
* jam 16.00 → close fix ✅

malam:
→ baru boleh dipake buat prediksi selasa

---

## 💥 konsekuensi kalo salah

kalo backend ambil:

* data intraday / belum close

maka:

* model dapet data setengah matang
* prediksi bias / ga akurat

ujungnya:
user:
"wah modelnya jelek"
padahal datanya yg salah 😅

---

## 🔧 TANGGUNG JAWAB BACKEND

backend itu bukan cuma API

tapi:

* filter data
* validasi data
* pastiin yg dikirim ke model itu final

---

### backend stack

* flask
* sqlalchemy
* bcrypt
* limiter
* cors

---

### struktur penting

app/

* routes → endpoint
* models → db
* config → config
* **init** → init app

---

### route grouping

```
/api/auth
/api/admin
/api/investor
```

biar ga berantakan

---

### auth

* register → hash password (bcrypt)
* login → compare hash

ingat:

* jangan pernah simpen plain password
* hati2 double hashing

---

### CORS

allow:

* localhost:5173
* localhost:3000

kena di:

```
/api/*
```

kalo FE beda origin → langsung ditolak

---

### limiter

```
200/day
50/hour
```

buat:

* anti spam
* anti brute force

kadang ganggu pas testing → wajar 😅

---

### database (sqlalchemy)

flow:
model → query → response

catatan:

* jangan semua logic di route
* nanti susah debug

ideal:
route → service → model
(tapi sekarang masih oke campur dikit)

---

## ⚠️ LOGIC PREDIKSI DI BACKEND

yang harus dipastiin:

* ambil data close terakhir yg:
  → sudah final
  → bukan data berjalan

---

### pseudo mindset

"ambil last known valid close"

bukan:
"ambil harga terbaru yg ada sekarang"

---

## 🎯 TANGGUNG JAWAB FRONTEND

frontend bukan cuma tampilan

tapi:

* nerjemahin data
* ngejaga user ga salah ngerti

---

### frontend stack

* react
* fetch / axios

---

### flow FE

user klik →
fetch API →
dapet response →
render

---

### ⚠️ masalah klasik frontend

1. data undefined
2. key mismatch
3. response beda format

contoh fatal:

```js
data.price
```

padahal:

```js
data.data.price
```

langsung crash 💀

---

### best practice FE

* optional chaining:

```js
data?.price
```

* kasih loading state
* kasih error state
* jangan assume data selalu ada

---

## ⚠️ BAGIAN KRUSIAL DI FRONTEND: EDUKASI USER

ini yg sering diremehin tapi penting banget

user ga ngerti:

* close price
* market time
* data valid vs belum

---

### masalah real user

user bisa:

* prediksi pagi
* prediksi siang
* prediksi kapan aja

padahal:
datanya belum final

---

### solusi (WAJIB ADA DI UI)

kasih info yg jelas

❌ jangan cuma:
"prediksi sebelum market buka"

itu ambigu

---

### ✅ pakai ini:

"Prediksi sebaiknya dilakukan setelah market tutup di hari yang sama agar model menggunakan harga penutupan (close) terbaru, bukan data hari sebelumnya."

---

### tujuan

biar user:

* ga salah timing
* ga nyalahin model

---

## 🔄 RELASI BACKEND vs FRONTEND

backend:
→ jaga data valid

frontend:
→ jaga user paham

kalo salah satu gagal:
→ sistem tetep gagal

---

## 🧨 BUG YG SERING BANGET

### backend aman, frontend merah

* format response beda
* null value

---

### login gagal terus

* hash mismatch

---

### data kosong

* query ga match

---

### cors error

* origin belum whitelist

---

### loading muter terus

* lupa set false

---

## 🧠 MINDSET YG HARUS DIPEGANG

ini bukan sekadar:
"app prediksi saham"

tapi:
→ decision support tool

---

## ⚡ future improvement (kalo ga males 😅)

backend:

* JWT auth
* service layer
* better logging
* validasi input

frontend:

* better state management
* error boundary
* UX edukasi lebih kuat

---

## 🔚 INTINYA

kalau diringkas:

* model itu bodoh → cuma makan data
* backend → jaga kualitas data
* frontend → jaga pemahaman user

kalau:
data salah ❌
→ model salah ❌
→ user makin sotoy 📉

---
