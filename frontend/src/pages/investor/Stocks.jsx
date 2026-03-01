import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, TrendingUp, TrendingDown } from "lucide-react";

import GradientSection from "@/components/GradientBg";

const mockStocks = [
  { ticker: "BBCA", name: "Bank Central Asia Tbk", price: "9,450", change: "+2.34%", volume: "125.3M" },
  { ticker: "BMRI", name: "Bank Mandiri (Persero) Tbk", price: "6,775", change: "+1.87%", volume: "89.2M" },
  { ticker: "ASII", name: "Astra International Tbk", price: "8,200", change: "-0.45%", volume: "45.1M" },
  { ticker: "TLKM", name: "Telekomunikasi Indonesia Tbk", price: "2,895", change: "+0.98%", volume: "234.5M" },
  { ticker: "UNVR", name: "Unilever Indonesia Tbk", price: "2,540", change: "-1.23%", volume: "12.4M" },
];

export default function InvestorStocks() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStocks = mockStocks.filter((stock) =>
    stock.ticker.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <GradientSection className="min-h-screen">
      <div className="space-y-10 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-indigo-950/30 border border-cyan-500/20 rounded-2xl p-8 md:p-12 backdrop-blur-md">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Cari Saham
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl">
            Temukan saham yang Anda inginkan dengan analisis lengkap dan prediksi harga
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari ticker atau nama perusahaan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/70 border border-slate-700 rounded-xl pl-14 pr-6 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all duration-200 backdrop-blur-sm"
          />
        </div>

        {/* Table */}
        <div className="bg-slate-900/65 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/40">
                  <th className="px-6 py-5 text-left text-sm font-semibold text-slate-300">Saham</th>
                  <th className="px-6 py-5 text-left text-sm font-semibold text-slate-300">Harga</th>
                  <th className="px-6 py-5 text-left text-sm font-semibold text-slate-300">Perubahan</th>
                  <th className="px-6 py-5 text-left text-sm font-semibold text-slate-300">Volume</th>
                  <th className="px-6 py-5 text-left text-sm font-semibold text-slate-300">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.length > 0 ? (
                  filteredStocks.map((stock) => (
                    <tr
                      key={stock.ticker}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-semibold text-white">{stock.ticker}</p>
                          <p className="text-sm text-slate-400">{stock.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-semibold text-white">
                        Rp {stock.price}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          {stock.change.includes("+") ? (
                            <TrendingUp className="w-5 h-5 text-green-500" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-500" />
                          )}
                          <span
                            className={stock.change.includes("+") ? "text-green-400" : "text-red-400"}
                          >
                            {stock.change}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-slate-300">{stock.volume}</td>
                      <td className="px-6 py-5">
                        <Link
                          to={`/investor/stocks/${stock.ticker}`}
                          className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                        >
                          Lihat Detail →
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-lg">
                      Tidak ditemukan saham dengan kata kunci "{searchQuery}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </GradientSection>
  );
}