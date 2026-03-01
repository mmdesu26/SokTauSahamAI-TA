import { useState } from "react";
import { Search, BookOpen } from "lucide-react";
import GradientSection from "@/components/GradientBg";

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
    definition: "Indeks utama bursa saham Indonesia yang mencakup semua saham tercatat di BEI.",
  },
  {
    term: "Bullish",
    definition: "Kondisi pasar atau saham yang diperkirakan akan naik harganya dalam waktu dekat.",
  },
  {
    term: "Bearish",
    definition: "Kondisi pasar atau saham yang diperkirakan akan turun harganya dalam waktu dekat.",
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
    definition: "Pembagian keuntungan perusahaan kepada pemegang saham biasanya dalam bentuk uang tunai atau saham.",
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
    <GradientSection className="min-h-screen">
      <div className="space-y-10 pb-16 max-w-6xl mx-auto">
        {/* Header / Hero */}
        <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-indigo-950/30 border border-cyan-500/20 rounded-2xl p-8 md:p-12 backdrop-blur-md">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-cyan-600/20 rounded-xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-cyan-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Glosarium Saham
            </h1>
          </div>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl">
            Pahami istilah-istilah penting dalam dunia investasi saham dan analisis pasar Indonesia
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari istilah, singkatan, atau definisi..."
            className="w-full bg-slate-900/70 border border-slate-700 rounded-xl pl-14 pr-6 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all duration-200 backdrop-blur-sm"
          />
        </div>

        {/* Daftar Istilah */}
        {filtered.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item, idx) => (
              <div
                key={idx}
                className="group bg-slate-900/65 border border-slate-800 rounded-2xl p-7 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-900/20 transition-all duration-300 backdrop-blur-md"
              >
                <h3 className="text-xl font-semibold text-cyan-400 mb-4 group-hover:text-cyan-300 transition-colors">
                  {item.term}
                </h3>
                <p className="text-slate-300 leading-relaxed">{item.definition}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-slate-400 text-xl">
              Tidak menemukan istilah yang sesuai dengan pencarian "{searchQuery}"
            </p>
            <p className="text-slate-500 mt-2">
              Coba gunakan kata kunci lain atau hapus filter pencarian
            </p>
          </div>
        )}
      </div>
    </GradientSection>
  );
}