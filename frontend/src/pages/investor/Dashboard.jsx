import { TrendingUp, TrendingDown, ArrowRight, Coins, Landmark } from "lucide-react";
import { Link } from "react-router-dom";

export default function InvestorDashboard() {
  const topStocks = [
    {
      ticker: "BBCA",
      name: "Bank Central Asia",
      price: "9,450",
      change: "+2.34%",
      positive: true,
    },
    {
      ticker: "BMRI",
      name: "Bank Mandiri",
      price: "6,775",
      change: "+1.87%",
      positive: true,
    },
    {
      ticker: "BBRI",
      name: "Bank Rakyat Indonesia",
      price: "8,200",
      change: "-0.45%",
      positive: false,
    },
  ];

  return (
    <div className="w-full space-y-12">
      {/* Welcome */}
      <section className="rounded-3xl border border-[#4988C4]/25 bg-gradient-to-r from-[#0F2854]/55 via-[#1C4D8D]/35 to-[#4988C4]/25 p-8 backdrop-blur-md md:p-12">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
          Selamat Datang!
        </h1>
        <p className="max-w-3xl text-lg text-slate-300 md:text-xl">
          Analisis saham • Prediksi harga closing • Rekomendasi Buy/Sell
        </p>
      </section>

      {/* Market Overview */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Ringkasan Pasar Hari Ini
          </h2>
          <p className="mt-2 text-slate-400">
            Indikator utama yang dapat memengaruhi pergerakan saham Indonesia
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* IHSG */}
          <div className="rounded-3xl border border-slate-700/80 bg-slate-900/65 p-7 backdrop-blur-md transition-all duration-300 hover:border-slate-500/70">
            <p className="mb-3 text-sm font-medium text-slate-400">IHSG Hari Ini</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                  7,425.32
                </p>
                <p className="mt-2 text-base font-medium text-green-400">
                  +2.34% dari kemarin
                </p>
              </div>
              <TrendingUp className="h-16 w-16 text-green-500/25" />
            </div>
          </div>

          {/* Harga Emas */}
          <div className="rounded-3xl border border-slate-700/80 bg-slate-900/65 p-7 backdrop-blur-md transition-all duration-300 hover:border-slate-500/70">
            <p className="mb-3 text-sm font-medium text-slate-400">Harga Emas</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                  1,245,000
                </p>
                <p className="mt-2 text-base font-medium text-green-400">
                  +0.85% hari ini
                </p>
                <p className="mt-1 text-xs text-slate-500">per gram</p>
              </div>
              <Coins className="h-16 w-16 text-yellow-400/25" />
            </div>
          </div>

          {/* BI Rate */}
          <div className="rounded-3xl border border-slate-700/80 bg-slate-900/65 p-7 backdrop-blur-md transition-all duration-300 hover:border-slate-500/70">
            <p className="mb-3 text-sm font-medium text-slate-400">BI Rate</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                  4.75%
                </p>
                <p className="mt-2 text-base font-medium text-sky-400">
                  Tetap dari RDG sebelumnya
                </p>
                <p className="mt-1 text-xs text-slate-500">per 19 Februari 2026</p>
              </div>
              <Landmark className="h-16 w-16 text-cyan-400/25" />
            </div>
          </div>
        </div>
      </section>

      {/* Saham Populer */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Saham Populer Hari Ini
          </h2>
          <Link
            to="/investor/stocks"
            className="flex items-center gap-2 font-medium text-[#BDE8F5] transition-colors hover:text-[#BDE8F5]/80"
          >
            Lihat Semua
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {topStocks.map((stock) => (
            <Link
              key={stock.ticker}
              to={`/investor/stocks/${stock.ticker}`}
              className="group rounded-3xl border border-slate-800 bg-slate-900/65 p-7 backdrop-blur-md transition-all duration-300 hover:border-[#4988C4]/60 hover:shadow-xl hover:shadow-[#1C4D8D]/25"
            >
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-white transition-colors group-hover:text-[#BDE8F5]">
                    {stock.ticker}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">{stock.name}</p>
                </div>

                {stock.positive ? (
                  <TrendingUp className="mt-1 h-7 w-7 text-green-500" />
                ) : (
                  <TrendingDown className="mt-1 h-7 w-7 text-red-500" />
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
      <section className="rounded-3xl border border-[#4988C4]/20 bg-gradient-to-br from-[#1C4D8D]/35 to-slate-900/60 p-8 backdrop-blur-md md:p-10">
        <h3 className="mb-6 text-2xl font-semibold text-white">
          Tips Investasi Hari Ini
        </h3>

        <ul className="space-y-4 text-[15px] text-slate-200">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-xl text-[#BDE8F5]">•</span>
            Monitor trading realtime dari broker yang digunakan
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-xl text-[#BDE8F5]">•</span>
            Perhatikan rilis berita fundamental sebelum entry
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-xl text-[#BDE8F5]">•</span>
            Jangan lupa untuk melihat update berita
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-xl text-[#BDE8F5]">•</span>
            Disiplin untuk cut loss jika sudah di bawah 5% dari harga beli
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-xl text-[#BDE8F5]">•</span>
            Disclaimer On
          </li>
        </ul>
      </section>
    </div>
  );
}