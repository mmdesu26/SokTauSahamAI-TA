import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import GradientSection from "@/components/GradientBg";
import Button from "@/components/Button";

export default function InvestorDashboard() {
  const topStocks = [
    { ticker: "BBCA", name: "Bank Central Asia", price: "9,450", change: "+2.34%", positive: true },
    { ticker: "BMRI", name: "Bank Mandiri", price: "6,775", change: "+1.87%", positive: true },
    { ticker: "BBRI", name: "Bank Rakyat Indonesia", price: "8,200", change: "-0.45%", positive: false },
  ];

  return (
    <GradientSection className="min-h-screen w-full">
      {/* Padding navbar, tanpa max-w di luar supaya gradient full layar */}
      <div className="pt-5 md:pt-20 lg:pt-24 pb-16 px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Konten utama dibatasi lebar supaya card compact di tengah */}
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Welcome */}
          <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-indigo-950/30 border border-cyan-500/20 rounded-2xl p-8 md:p-12 backdrop-blur-md">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Selamat Datang!
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-3xl">
              Analisis saham • Prediksi harga closing • Rekomendasi Buy/Sell
            </p>
          </div>

          {/* IHSG Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900/65 border border-slate-700/80 rounded-2xl p-7 hover:border-slate-500/70 transition-all duration-300 backdrop-blur-md">
              <p className="text-slate-400 text-sm font-medium mb-3">IHSG Hari Ini</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                    7,425.32
                  </p>
                  <p className="text-green-400 text-base font-medium mt-2">
                    +2.34% dari kemarin
                  </p>
                </div>
                <TrendingUp className="w-16 h-16 text-green-500/25" />
              </div>
            </div>
          </div>

          {/* Saham Populer */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Saham Populer Hari Ini
              </h2>
              <Link
                to="/investor/stocks"
                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                Lihat Semua
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topStocks.map((stock) => (
                <Link
                  key={stock.ticker}
                  to={`/investor/stocks/${stock.ticker}`}
                  className="group bg-slate-900/65 border border-slate-800 rounded-2xl p-7 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-900/20 transition-all duration-300 backdrop-blur-md"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {stock.ticker}
                      </p>
                      <p className="text-sm text-slate-400 mt-1">{stock.name}</p>
                    </div>
                    {stock.positive ? (
                      <TrendingUp className="w-7 h-7 text-green-500 mt-1" />
                    ) : (
                      <TrendingDown className="w-7 h-7 text-red-500 mt-1" />
                    )}
                  </div>

                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-semibold text-white">
                      Rp {stock.price}
                    </p>
                    <p
                      className={`text-lg font-medium ${
                        stock.positive ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {stock.change}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Tips */}
          <div className="bg-gradient-to-br from-blue-950/50 to-slate-900/60 border border-blue-500/20 rounded-2xl p-8 md:p-10 backdrop-blur-md">
            <h3 className="text-2xl font-semibold text-white mb-6">
              Tips Investasi Hari Ini
            </h3>
            <ul className="space-y-4 text-slate-200 text-[15px]">
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 text-xl mt-0.5">•</span>
                Monitor trading realtime dari broker yang kamu gunakan
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 text-xl mt-0.5">•</span>
                Perhatikan rilis berita fundamental sebelum entry
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 text-xl mt-0.5">•</span>
                Jangan lupa untuk melihat update berita
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 text-xl mt-0.5">•</span>
                Disiplin untuk cut loss jika sudah di bawah 5% dari harga beli
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 text-xl mt-0.5">•</span>
                Disclaimer On.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </GradientSection>
  );
}