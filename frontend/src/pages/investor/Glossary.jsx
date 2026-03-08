import { useState } from "react";
import { Search, BookOpen } from "lucide-react";

const glossaryItems = [
  {
    term: "PER (Price-to-Earnings Ratio)",
    definition:
      "Rasio perbandingan harga saham terhadap laba per lembar saham. Semakin rendah PER, semakin murah valuasi saham.",
  },
  {
    term: "PBV (Price-to-Book Value)",
    definition:
      "Rasio perbandingan harga saham terhadap nilai aset bersih per lembar. Digunakan untuk menilai saham value.",
  },
  {
    term: "ROE (Return on Equity)",
    definition:
      "Rasio profitabilitas yang menunjukkan seberapa efisien perusahaan menggunakan modal pemegang saham untuk menghasilkan laba.",
  },
  {
    term: "EPS (Earnings Per Share)",
    definition:
      "Laba bersih perusahaan dibagi jumlah saham beredar. Menunjukkan berapa banyak keuntungan yang diperoleh setiap lembar saham.",
  },
  {
    term: "IHSG (Indeks Harga Saham Gabungan)",
    definition:
      "Indeks utama bursa saham Indonesia yang mencakup semua saham tercatat di BEI.",
  },
  {
    term: "Bullish",
    definition:
      "Kondisi pasar atau saham yang diperkirakan akan naik harganya dalam waktu dekat.",
  },
  {
    term: "Bearish",
    definition:
      "Kondisi pasar atau saham yang diperkirakan akan turun harganya dalam waktu dekat.",
  },
  {
    term: "Support & Resistance",
    definition:
      "Level harga dimana permintaan cenderung menahan penurunan (support) atau penawaran menahan kenaikan (resistance).",
  },
  {
    term: "Moving Average",
    definition:
      "Rata-rata harga saham dalam periode tertentu yang digunakan untuk mengidentifikasi tren dan sinyal trading.",
  },
  {
    term: "Dividend",
    definition:
      "Pembagian keuntungan perusahaan kepada pemegang saham biasanya dalam bentuk uang tunai atau saham.",
  },
];

export default function InvestorGlossary() {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = glossaryItems.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      item.term.toLowerCase().includes(q) ||
      item.definition.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 pb-16">
      {/* Header / Hero */}
      <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-indigo-950/30 p-8 backdrop-blur-md md:p-12">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-600/20">
            <BookOpen className="h-7 w-7 text-cyan-400" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Glosarium Saham
          </h1>
        </div>

        <p className="max-w-3xl text-lg text-slate-300 md:text-xl">
          Pahami istilah-istilah penting dalam dunia investasi saham dan analisis
          pasar Indonesia
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mx-auto max-w-2xl">
        <Search className="pointer-events-none absolute top-1/2 left-5 h-6 w-6 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari istilah, singkatan, atau definisi..."
          className="w-full rounded-xl border border-slate-700 bg-slate-900/70 py-4 pr-6 pl-14 text-white placeholder-slate-500 backdrop-blur-sm transition-all duration-200 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 focus:outline-none"
        />
      </div>

      {/* Daftar Istilah */}
      {filtered.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              className="group rounded-3xl border border-slate-800 bg-slate-900/65 p-7 backdrop-blur-md transition-all duration-300 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-900/20"
            >
              <h3 className="mb-4 text-xl font-semibold text-cyan-400 transition-colors group-hover:text-cyan-300">
                {item.term}
              </h3>
              <p className="leading-relaxed text-slate-300">{item.definition}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-xl text-slate-400">
            Tidak menemukan istilah yang sesuai dengan pencarian "{searchQuery}"
          </p>
          <p className="mt-2 text-slate-500">
            Coba gunakan kata kunci lain atau hapus filter pencarian
          </p>
        </div>
      )}
    </div>
  );
}