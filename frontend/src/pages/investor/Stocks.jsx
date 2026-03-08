import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, TrendingUp, TrendingDown } from "lucide-react";

const mockStocks = [
  { ticker: "BBCA", name: "Bank Central Asia Tbk", price: "9,450", change: "+2.34%", volume: "125.3M" },
  { ticker: "BMRI", name: "Bank Mandiri (Persero) Tbk", price: "6,775", change: "+1.87%", volume: "89.2M" },
  { ticker: "ASII", name: "Astra International Tbk", price: "8,200", change: "-0.45%", volume: "45.1M" },
  { ticker: "TLKM", name: "Telekomunikasi Indonesia Tbk", price: "2,895", change: "+0.98%", volume: "234.5M" },
  { ticker: "UNVR", name: "Unilever Indonesia Tbk", price: "2,540", change: "-1.23%", volume: "12.4M" },
];

export default function InvestorStocks() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStocks = mockStocks.filter((stock) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      stock.ticker.toLowerCase().includes(query) ||
      stock.name.toLowerCase().includes(query)
    );
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-10 px-4 pb-16 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-indigo-950/30 p-8 backdrop-blur-md md:p-12">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
          Cari Saham
        </h1>
        <p className="max-w-3xl text-lg text-slate-300 md:text-xl">
          Temukan saham yang diinginkan dengan analisis lengkap dan prediksi harga
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mx-auto max-w-2xl">
        <Search className="pointer-events-none absolute top-1/2 left-5 h-6 w-6 -translate-y-1/2 text-slate-500" />
        <input
            type="text"
            placeholder="Cari ticker atau nama saham..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-lg pl-15 pr-4 py-3 
            text-white placeholder-slate-500 focus:outline-none focus:border-[#4988C4]/60 transition"
          />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/65 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/40">
                <th className="px-6 py-5 text-left text-sm font-semibold text-slate-300">
                  Saham
                </th>
                <th className="px-6 py-5 text-left text-sm font-semibold text-slate-300">
                  Harga
                </th>
                <th className="px-6 py-5 text-left text-sm font-semibold text-slate-300">
                  Perubahan
                </th>
                <th className="px-6 py-5 text-left text-sm font-semibold text-slate-300">
                  Volume
                </th>
                <th className="px-6 py-5 text-left text-sm font-semibold text-slate-300">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredStocks.length > 0 ? (
                filteredStocks.map((stock) => (
                  <tr
                    key={stock.ticker}
                    className="border-b border-slate-800/50 transition-colors hover:bg-slate-800/30"
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
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                        <span
                          className={
                            stock.change.includes("+")
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {stock.change}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-slate-300">{stock.volume}</td>

                    <td className="px-6 py-5">
                      <Link
                        to={`/investor/stocks/${stock.ticker}`}
                        className="font-medium text-cyan-400 transition-colors hover:text-cyan-300"
                      >
                        Lihat Detail →
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-lg text-slate-400"
                  >
                    Tidak ditemukan saham dengan kata kunci "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}