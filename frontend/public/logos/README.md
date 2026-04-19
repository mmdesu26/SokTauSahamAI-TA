# Folder `/public/logos/`

Folder ini OPSIONAL. Dipake kalau mau override logo otomatis (Clearbit / Google
favicon) dengan file lokal yang lebih presisi.

## Cara pake:

1. Siapin file PNG transparan, ukuran ~256x256 px
2. Simpen di folder ini dengan nama lowercase, contoh: `bbca.png`, `bbri.png`
3. Pastiin mapping-nya udah ada di `/src/utils/stockLogoMap.js`
4. Restart dev server — otomatis kepake

## Kalau folder ini kosong

Gak papa — aplikasi bakal otomatis fallback ke:
- `logo.clearbit.com/{domain}` (dari website perusahaan)
- `google.com/s2/favicons?domain={domain}` (fallback favicon)
- Placeholder text (inisial ticker) kalau semua gagal
