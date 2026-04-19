// ============================================================
// StockLogo.jsx — kompoen logo saham otomatis
// FIX: kalau URL pertama gagal, pindah ke kandidat berikutnya (Clearbit -> favicon -> dst)
// ============================================================

import { useMemo, useState } from "react"; // hook React
import { getCompanyLogoCandidates } from "@/utils/logoHelper"; // ambil fungsi multi-source
import { cn } from "@/lib/utils"; // helper className

export default function StockLogo({
  ticker, // kode saham (BBCA, BBRI, dll)
  website, // url resmi perusahaan (optional, dari yfinance)
  logoUrl, // url logo manual kalau ada (optional)
  size = "md", // ukuran preset
  className, // class tambahan
}) {
  // preset ukuran — tinggal pilih
  const sizes = {
    sm: "h-8 w-8 text-xs", // kecil
    md: "h-10 w-10 text-sm", // default
    lg: "h-14 w-14 text-base", // gede
    xl: "h-20 w-20 text-xl", // paling gede (buat header detail)
  };

  // hitung array kandidat URL sekali aja per render
  const candidates = useMemo(
    () => getCompanyLogoCandidates(website, ticker, logoUrl),
    [website, ticker, logoUrl] // recompute kalau props berubah
  );

  // index kandidat yang lagi dicoba
  const [idx, setIdx] = useState(0);

  // URL aktif — null kalau semua kandidat udah habis
  const currentUrl = candidates[idx] || null;

  // handler kalau <img> gagal load -> pindah ke kandidat berikutnya
  const handleError = () => {
    setIdx((prev) => prev + 1); // naikkin index, kalau out of range -> jadi null -> tampil placeholder
  };

  // kalau nggak ada URL atau semua udah gagal -> tampilin placeholder teks
  if (!currentUrl) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl bg-primary-soft font-bold uppercase text-primary", // kotak placeholder
          sizes[size],
          className
        )}
      >
        {(ticker || "?").slice(0, 4)} {/* tulisin 4 huruf ticker */}
      </div>
    );
  }

  // render img dengan URL aktif
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card", // bingkai
        sizes[size],
        className
      )}
    >
      <img
        key={currentUrl} // key = URL biar React unmount-remount kalau ganti source
        src={currentUrl} // url aktif
        alt={ticker || "logo"} // alt text
        loading="lazy" // lazy load biar nggak ngebebanin
        onError={handleError} // kalau gagal -> coba kandidat berikut
        className="h-full w-full object-contain p-1" // pas di dalam kotak
      />
    </div>
  );
}
