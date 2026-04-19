// ============================================================
// stockLogoMap.js — mapping manual ticker -> path logo lokal
// ============================================================
// Catatan: file-file PNG di /public/logos/ OPSIONAL.
// Kalau folder /public/logos/ kosong, logo tetap jalan via Clearbit/Google favicon
// (lihat logoHelper.js). Map ini cuma buat override kalau mau pake logo lokal
// biar lebih cepat atau lebih presisi dibanding Clearbit.
//
// Cara aktifin logo lokal:
//   1. Download logo .png (resolusi ~256px, background transparan) ke /public/logos/
//   2. Pastiin nama file sesuai mapping di bawah (contoh: bbca.png)
//   3. Udah, otomatis dipake duluan sebelum fallback ke Clearbit
// ============================================================

export const STOCK_LOGO_MAP = {
  BBRI: "/logos/bbri.png", // Bank Rakyat Indonesia
  BBCA: "/logos/bbca.png", // Bank Central Asia
  BBNI: "/logos/bbni.png", // Bank Negara Indonesia
  BMRI: "/logos/bmri.png", // Bank Mandiri
  BRPT: "/logos/brpt.png", // Barito Pacific
  HUMI: "/logos/humi.png", // Humphrey Energy
  UNVR: "/logos/unvr.png", // Unilever Indonesia
  ICBP: "/logos/icbp.png", // Indofood CBP
  INDF: "/logos/indf.png", // Indofood Sukses Makmur
  PGAS: "/logos/pgas.png", // Perusahaan Gas Negara
  ANTM: "/logos/antm.png", // Aneka Tambang
  ADRO: "/logos/adro.png", // Adaro Energy
  PTBA: "/logos/ptba.png", // Bukit Asam
  GOTO: "/logos/goto.png", // GoTo Gojek Tokopedia
  AMMN: "/logos/ammn.png", // Amman Mineral Internasional
};
