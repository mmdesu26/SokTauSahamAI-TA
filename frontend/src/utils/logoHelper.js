// ============================================================
// logoHelper.js — nentuin URL logo perusahaan buat ditampilin
// Strategi: logoUrl dari backend -> map manual lokal -> Clearbit (website) ->
//           Google favicon (website) -> domain IDX fallback -> null (pakai placeholder)
// ============================================================

import { STOCK_LOGO_MAP } from "@/utils/stockLogoMap"; // map statik ticker -> path logo lokal

// helper kecil buat validasi + normalisasi url jadi https://host
function extractHostname(rawUrl) {
  if (!rawUrl) return null; // kosong? skip
  try {
    // tambahin https:// kalau user nyimpan tanpa protokol
    const normalized = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const url = new URL(normalized); // parse URL
    return url.hostname.replace(/^www\./i, ""); // buang "www." biar clearbit suka
  } catch {
    return null; // url invalid -> null
  }
}

// main function — balikin array kandidat URL logo (urutan = prioritas)
export function getCompanyLogoCandidates(website, ticker, logoUrl) {
  const candidates = []; // list URL yang bakal dicoba

  // 1) kalau backend udah ngasih logoUrl langsung -> paling prioritas
  if (logoUrl) candidates.push(logoUrl);

  // 2) cek map manual lokal (contoh: BBCA -> /logos/bbca.png)
  const upperTicker = String(ticker || "").toUpperCase().trim(); // rapihin ticker
  if (upperTicker && STOCK_LOGO_MAP[upperTicker]) {
    candidates.push(STOCK_LOGO_MAP[upperTicker]); // ada di map -> tambahin
  }

  // 3) kalau ada website dari yfinance -> coba Clearbit + Google favicon
  const host = extractHostname(website);
  if (host) {
    candidates.push(`https://logo.clearbit.com/${host}`); // Clearbit (logo beneran)
    candidates.push(`https://www.google.com/s2/favicons?domain=${host}&sz=128`); // fallback favicon
  }

  // 4) kalau nggak ada website sama sekali, coba tebak domain dari ticker
  //    (trik: banyak emiten IDX pakai pola "namaperusahaan.co.id" / ".com")
  //    ini nggak selalu kena, tapi lumayan buat ticker populer
  if (upperTicker && !host) {
    const lower = upperTicker.toLowerCase(); // bbca, bbri, dst
    candidates.push(`https://logo.clearbit.com/${lower}.co.id`); // tebakan .co.id
    candidates.push(`https://logo.clearbit.com/${lower}.com`); // tebakan .com
  }

  return candidates; // balikin array (bisa kosong)
}

// versi lama — backward compat, balikin 1 URL pertama aja
export function getCompanyLogo(website, ticker, logoUrl) {
  const list = getCompanyLogoCandidates(website, ticker, logoUrl); // ambil kandidat
  return list.length ? list[0] : null; // ambil yang pertama atau null
}
