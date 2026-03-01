import { useMemo, useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { TrendingUp, AlertTriangle } from "lucide-react";
import ReactApexChart from "react-apexcharts";

import Button from "@/components/Button";
import GradientSection from "@/components/GradientBg";

function formatIDR(n) {
  if (!Number.isFinite(n)) return "Rp 0";
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}
function formatNumber(n) {
  if (!Number.isFinite(n)) return "0";
  return Math.round(n).toLocaleString("id-ID");
}
function formatPercent(n) {
  if (!Number.isFinite(n)) return "0%";
  return `${n.toFixed(1)}%`;
}

const dummyCompanyProfile = {
  longName: "PT Contoh Emiten Indonesia Tbk",
  shortName: "CONTOH",
  sector: "Keuangan",
  industry: "Perbankan",
  longBusinessSummary:
    "Perusahaan ini bergerak di bidang jasa perbankan dan layanan keuangan di Indonesia. Fokus utama mencakup penghimpunan dana masyarakat, penyaluran kredit, serta penyediaan produk digital banking. Kinerja perusahaan dipengaruhi oleh kondisi ekonomi makro, suku bunga, kualitas aset, serta pertumbuhan kredit dan dana pihak ketiga.",
  website: "https://www.contoh-emiten.co.id",
  city: "Jakarta",
  country: "Indonesia",
};

const dummyFundamentals = {
  epsTTM: 665, // Rp
  perTTM: 14.25, // x
  pbv: 1.85, // x
  roe: 18.5, // %
  revenue: 125_500_000_000_000, // Rp
  netIncome: 38_200_000_000_000, // Rp
  totalAssets: 1_650_000_000_000_000, // Rp
  totalEquity: 206_000_000_000_000, // Rp
};

const dummyBenchmarks = {
  per: 15.5,
  pbv: 2.1,
  roe: 16.2,
  eps: 620,
};

export default function InvestorStockDetail() {
  const { ticker = "" } = useParams();

  const [timeframe, setTimeframe] = useState("1D");
  const [activeTab, setActiveTab] = useState(null);

  const [chartReady, setChartReady] = useState(false);
  const chartContainerRef = useRef(null);

  useEffect(() => {
    const checkSize = () => {
      if (!chartContainerRef.current) return;
      const { width, height } = chartContainerRef.current.getBoundingClientRect();
      if (width > 10 && height > 10) setChartReady(true);
    };

    checkSize();
    const observer = new ResizeObserver(checkSize);
    if (chartContainerRef.current) observer.observe(chartContainerRef.current);
    const timer = setTimeout(checkSize, 500);

    return () => {
      if (chartContainerRef.current) observer.unobserve(chartContainerRef.current);
      clearTimeout(timer);
    };
  }, []);

  const candles = useMemo(() => {
    let rawCandles = [];

    if (timeframe === "1D") {
      rawCandles = [
        { t: "09:00", open: 395, high: 398, low: 392, close: 393 },
        { t: "09:15", open: 393, high: 405, low: 392, close: 403 },
        { t: "09:30", open: 403, high: 410, low: 401, close: 408 },
        { t: "09:45", open: 408, high: 416, low: 407, close: 414 },
        { t: "10:00", open: 414, high: 420, low: 405, close: 418 },
        { t: "10:15", open: 418, high: 432, low: 416, close: 430 },
        { t: "10:30", open: 430, high: 440, low: 428, close: 438 },
        { t: "11:00", open: 392, high: 396, low: 390, close: 395 },
        { t: "11:15", open: 395, high: 405, low: 394, close: 403 },
        { t: "11:30", open: 403, high: 412, low: 401, close: 410 },
        { t: "11:45", open: 410, high: 418, low: 408, close: 414 },
        { t: "12:00", open: 414, high: 430, low: 412, close: 428 },
        { t: "12:15", open: 428, high: 442, low: 426, close: 440 },
        { t: "13:00", open: 398, high: 402, low: 395, close: 401 },
        { t: "13:15", open: 401, high: 410, low: 399, close: 408 },
        { t: "13:30", open: 408, high: 418, low: 406, close: 412 },
        { t: "13:45", open: 412, high: 420, low: 409, close: 418 },
        { t: "14:00", open: 418, high: 436, low: 415, close: 434 },
        { t: "14:15", open: 434, high: 448, low: 432, close: 446 },
        { t: "16:00", open: 400, high: 410, low: 398, close: 407 },
      ];
    } else {
      const base =
        timeframe === "1W"
          ? 7
          : timeframe === "1M"
          ? 20
          : timeframe === "3M"
          ? 60
          : 120;

      let price = 400;
      for (let i = 1; i <= base; i++) {
        const drift = (i % 5 === 0 ? -8 : 6) + (i % 9 === 0 ? -10 : 0);
        const open = price;
        const close = Math.max(200, open + drift);
        const high = Math.max(open, close) + 10;
        const low = Math.min(open, close) - 10;
        price = close;
        rawCandles.push({ t: `H${i}`, open, high, low, close });
      }
    }

    return rawCandles.map((c) => ({
      t: String(c.t),
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close),
    }));
  }, [timeframe]);

  const last = candles[candles.length - 1] || { close: 0 };
  const first = candles[0] || { open: 0 };
  const change = last.close - first.open;
  const pct = first.open === 0 ? 0 : (change / first.open) * 100;

  const timeframeBtnClass = (v) =>
    `px-5 py-2 rounded-xl text-sm font-semibold transition ${
      timeframe === v
        ? "bg-cyan-600/30 text-white border border-cyan-500/40"
        : "text-slate-300 hover:text-white hover:bg-slate-700/40"
    }`;

  const tabBtnClass = (tab) =>
    `flex-1 py-3 px-6 rounded-xl font-medium transition text-center ${
      activeTab === tab
        ? "bg-cyan-600/40 text-white border border-cyan-500/30 shadow-sm"
        : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/60"
    }`;

  /** ---------- chart options ---------- */
  const chartOptions = useMemo(
    () => ({
      chart: {
        type: "candlestick",
        height: "100%",
        background: "transparent",
        toolbar: { show: true },
        zoom: { enabled: true },
        foreColor: "#e2e8f0",
      },
      title: {
        text: `${ticker.toUpperCase()} - Chart Harga`,
        align: "left",
        style: { color: "#e2e8f0", fontSize: "16px" },
      },
      xaxis: {
        type: "category",
        labels: { style: { colors: "#94a3b8" } },
      },
      yaxis: {
        tooltip: { enabled: true },
        labels: { style: { colors: "#94a3b8" } },
      },
      tooltip: {
        theme: "dark",
        custom: ({ seriesIndex, dataPointIndex, w }) => {
          const o = w.globals.seriesCandleO[seriesIndex][dataPointIndex];
          const h = w.globals.seriesCandleH[seriesIndex][dataPointIndex];
          const l = w.globals.seriesCandleL[seriesIndex][dataPointIndex];
          const c = w.globals.seriesCandleC[seriesIndex][dataPointIndex];
          return `
            <div class="p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl">
              <div class="font-bold text-white">${w.globals.labels[dataPointIndex]}</div>
              <div>Open: <span class="text-green-400">${o}</span></div>
              <div>High: <span class="text-cyan-400">${h}</span></div>
              <div>Low: <span class="text-red-400">${l}</span></div>
              <div>Close: <span class="text-white font-bold">${c}</span></div>
            </div>
          `;
        },
      },
      plotOptions: {
        candlestick: {
          colors: { upward: "#22c55e", downward: "#ef4444" },
          wick: { useFillColor: true },
        },
      },
      grid: {
        borderColor: "rgba(148,163,184,0.1)",
        strokeDashArray: 3,
      },
    }),
    [ticker]
  );

  const chartSeries = useMemo(
    () => [
      {
        name: "Candlestick",
        data: candles.map((c) => ({
          x: c.t,
          y: [c.open, c.high, c.low, c.close],
        })),
      },
    ],
    [candles]
  );

  /** ---------- prediction logic ---------- */
  const closeToday = last.close;

  const predClose1Mo = useMemo(() => {
    return closeToday * 1.08;
  }, [closeToday]);

  const predDelta = predClose1Mo - closeToday;
  const predPct = closeToday === 0 ? 0 : (predDelta / closeToday) * 100;

  const trendDirection = predClose1Mo > closeToday ? "Naik" : "Turun";

  const recommendation = useMemo(() => {
    // threshold ±3%
    if (predPct > 3) return "BUY";
    if (predPct >= -3 && predPct <= 3) return "HOLD";
    return "SELL";
  }, [predPct]);

  const recommendationPillClass = useMemo(() => {
    if (recommendation === "BUY") return "bg-green-500/20 text-green-400 border-green-500/30";
    if (recommendation === "HOLD") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  }, [recommendation]);

  /** ---------- valuation interpretation ---------- */
  const valuation = useMemo(() => {
    // - jika PER & PBV di bawah benchmark dan ROE di atas benchmark => "Cenderung Murah"
    // - jika PER atau PBV jauh di atas benchmark (>= +10%) => "Cenderung Mahal"
    // - selain itu => "Wajar"
    const { perTTM, pbv, roe } = dummyFundamentals;
    const perBench = dummyBenchmarks.per;
    const pbvBench = dummyBenchmarks.pbv;
    const roeBench = dummyBenchmarks.roe;

    const perOver = perTTM >= perBench * 1.1;
    const pbvOver = pbv >= pbvBench * 1.1;

    const cheapSignal = perTTM <= perBench && pbv <= pbvBench && roe >= roeBench;

    if (cheapSignal) return { label: "Cenderung Murah", tone: "good" };
    if (perOver || pbvOver) return { label: "Cenderung Mahal", tone: "bad" };
    return { label: "Wajar", tone: "mid" };
  }, []);

  const valuationClass =
    valuation.tone === "good"
      ? "bg-green-500/15 text-green-300 border-green-500/25"
      : valuation.tone === "bad"
      ? "bg-red-500/15 text-red-300 border-red-500/25"
      : "bg-slate-500/15 text-slate-200 border-slate-500/25";

  return (
    <GradientSection className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-950/50 via-blue-950/40 to-indigo-950/40 border border-cyan-500/20 rounded-2xl p-8 md:p-10 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-cyan-600/30 to-blue-600/20 flex items-center justify-center border border-cyan-400/30">
                <TrendingUp className="w-10 h-10 text-cyan-300" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                  {ticker.toUpperCase()}
                </h1>
                <p className="text-xl text-slate-300 mt-1">{dummyCompanyProfile.longName}</p>
                <p className="text-lg text-cyan-400/80">
                  {dummyCompanyProfile.sector} • {dummyCompanyProfile.industry}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 min-w-[180px]">
              <p className="text-xs text-slate-300/80">Source: yfinance (dummy)</p>
            </div>
          </div>

          {/* OHLC Info */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-slate-400 text-sm">Open</p>
              <p className="text-xl font-semibold text-white">{first.open}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">High</p>
              <p className="text-xl font-semibold text-white">
                {Math.max(...candles.map((c) => c.high))}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Low</p>
              <p className="text-xl font-semibold text-white">
                {Math.min(...candles.map((c) => c.low))}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Close</p>
              <p className="text-xl font-semibold text-white">{last.close}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Perubahan</p>
              <p className={`text-xl font-bold ${change >= 0 ? "text-green-400" : "text-red-400"}`}>
                {change >= 0 ? "+" : ""}
                {change.toFixed(0)} ({pct.toFixed(1)}%)
              </p>
            </div>
          </div>

          {/* Timeframe Buttons */}
          <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
            {["1D", "1W", "1M", "3M", "1Y"].map((v) => (
              <button key={v} type="button" onClick={() => setTimeframe(v)} className={timeframeBtnClass(v)}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-slate-900/65 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
          <div ref={chartContainerRef} className="h-80 md:h-[420px] relative">
            {chartReady ? (
              <ReactApexChart options={chartOptions} series={chartSeries} type="candlestick" height="100%" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                Memuat chart...
              </div>
            )}
          </div>
        </div>

        {/* Bottom Tabs */}
        <div className="bg-slate-900/65 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
          {/* tombol prediksi (sesuai request: "saat klik prediksi saham munculkan ...") */}
          <Button onClick={() => setActiveTab(activeTab === "prediksi" ? null : "prediksi")}>
            Prediksi Saham
          </Button>

          <div className="flex flex-wrap gap-3 mb-6 mt-6">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === "deskripsi" ? null : "deskripsi")}
              className={tabBtnClass("deskripsi")}
            >
              Deskripsi Perusahaan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === "fundamental" ? null : "fundamental")}
              className={tabBtnClass("fundamental")}
            >
              Fundamental
            </button>
          </div>

          {/* Konten Tab */}
          {activeTab && (
            <div className="mt-4 animate-fade-in">
              {/* ---------------- PREDIKSI ---------------- */}
              {activeTab === "prediksi" && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-cyan-300 mb-3">
                        Harga Perkiraan Closing (1 Bulan)
                      </h3>
                      <div className="space-y-2 text-slate-300">
                        <div className="flex items-center justify-between">
                          <span>Harga sekarang (Close)</span>
                          <span className="font-semibold text-white">{formatIDR(closeToday)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Prediksi closing 1 bulan</span>
                          <span className="font-semibold text-white">{formatIDR(predClose1Mo)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Selisih</span>
                          <span className={`font-bold ${predDelta >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {predDelta >= 0 ? "+" : ""}
                            {formatIDR(predDelta)} ({predPct >= 0 ? "+" : ""}
                            {predPct.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-cyan-300 mb-3">Arah Tren & Rekomendasi</h3>

                      <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-300">Arah tren</span>
                        <span
                          className={`px-4 py-1 rounded-full border font-semibold ${
                            trendDirection === "Naik"
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          }`}
                        >
                          {trendDirection}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-300">Rekomendasi</span>
                        <span className={`px-4 py-1 rounded-full border font-semibold ${recommendationPillClass}`}>
                          {recommendation}
                        </span>
                      </div>

                      <p className="text-sm text-slate-400 leading-relaxed">
                        Aturan:
                        <br />
                        BUY jika prediksi &gt; +3%
                        <br />
                        HOLD jika antara -3% s/d +3%
                        <br />
                        SELL jika &lt; -3%
                      </p>
                    </div>
                  </div>

                  {/* disclaimer / warning */}
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 text-slate-200 flex gap-3">
                    <div className="mt-0.5">
                      <AlertTriangle className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-200">Disclaimer</p>
                      <p className="text-sm text-slate-300/90 leading-relaxed mt-1">
                        Prediksi ini dihasilkan dari model dan bertujuan untuk membantu analisis menggunakan fundamental perusahaan. Hasil prediksi
                        <span className="font-semibold"> bukan</span> kepastian dan tidak dapat dijadikan satu-satunya dasar keputusan investasi.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- DESKRIPSI ---------------- */}
              {activeTab === "deskripsi" && (
                <div className="space-y-6">
                  <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Profil Perusahaan</h3>

                    <div className="grid md:grid-cols-2 gap-4 text-slate-300">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-400">Nama (Long)</span>
                          <span className="text-white font-semibold text-right">
                            {dummyCompanyProfile.longName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-400">Nama (Short)</span>
                          <span className="text-white font-semibold">{dummyCompanyProfile.shortName}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-400">Sektor</span>
                          <span className="text-white font-semibold">{dummyCompanyProfile.sector}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-400">Industri</span>
                          <span className="text-white font-semibold">{dummyCompanyProfile.industry}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-400">Website</span>
                          <a
                            className="text-cyan-300 hover:text-cyan-200 underline underline-offset-4 text-right"
                            href={dummyCompanyProfile.website}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {dummyCompanyProfile.website.replace("https://", "")}
                          </a>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-400">Kota</span>
                          <span className="text-white font-semibold">{dummyCompanyProfile.city}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-400">Negara</span>
                          <span className="text-white font-semibold">{dummyCompanyProfile.country}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-3">Ringkasan Bisnis</h3>
                    <p className="text-slate-300 leading-relaxed">
                      {dummyCompanyProfile.longBusinessSummary}
                    </p>
                  </div>
                </div>
              )}

              {/* ---------------- FUNDAMENTAL ---------------- */}
              {activeTab === "fundamental" && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <h3 className="text-xl font-semibold text-white">Fundamental</h3>

                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${valuationClass}`}>
                      <span className="text-sm">Interpretasi:</span>
                      <span className="font-semibold">{valuation.label}</span>
                    </span>
                  </div>

                  {/* tabel ringkasan rasio */}
                  <div className="bg-slate-800/35 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-700/60">
                      <p className="text-white font-semibold">Rasio Utama</p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px]">
                        <thead>
                          <tr className="bg-slate-900/30 border-b border-slate-700/60">
                            <th className="text-left px-5 py-3 text-sm font-semibold text-slate-300">Metrik</th>
                            <th className="text-left px-5 py-3 text-sm font-semibold text-slate-300">Nilai</th>
                            <th className="text-left px-5 py-3 text-sm font-semibold text-slate-300">Benchmark</th>
                            <th className="text-left px-5 py-3 text-sm font-semibold text-slate-300">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-700/40">
                            <td className="px-5 py-4 text-slate-200 font-medium">EPS (TTM)</td>
                            <td className="px-5 py-4 text-white font-semibold">{formatIDR(dummyFundamentals.epsTTM)}</td>
                            <td className="px-5 py-4 text-slate-300">{formatIDR(dummyBenchmarks.eps)}</td>
                            <td className="px-5 py-4 text-slate-300">
                              {dummyFundamentals.epsTTM >= dummyBenchmarks.eps ? "Di atas benchmark" : "Di bawah benchmark"}
                            </td>
                          </tr>

                          <tr className="border-b border-slate-700/40">
                            <td className="px-5 py-4 text-slate-200 font-medium">PER (TTM)</td>
                            <td className="px-5 py-4 text-white font-semibold">{dummyFundamentals.perTTM.toFixed(2)}x</td>
                            <td className="px-5 py-4 text-slate-300">{dummyBenchmarks.per.toFixed(2)}x</td>
                            <td className="px-5 py-4 text-slate-300">
                              {dummyFundamentals.perTTM <= dummyBenchmarks.per ? "Relatif lebih murah" : "Relatif lebih mahal"}
                            </td>
                          </tr>

                          <tr className="border-b border-slate-700/40">
                            <td className="px-5 py-4 text-slate-200 font-medium">PBV</td>
                            <td className="px-5 py-4 text-white font-semibold">{dummyFundamentals.pbv.toFixed(2)}x</td>
                            <td className="px-5 py-4 text-slate-300">{dummyBenchmarks.pbv.toFixed(2)}x</td>
                            <td className="px-5 py-4 text-slate-300">
                              {dummyFundamentals.pbv <= dummyBenchmarks.pbv ? "Lebih rendah dari benchmark" : "Lebih tinggi dari benchmark"}
                            </td>
                          </tr>

                          <tr>
                            <td className="px-5 py-4 text-slate-200 font-medium">ROE</td>
                            <td className="px-5 py-4 text-white font-semibold">{formatPercent(dummyFundamentals.roe)}</td>
                            <td className="px-5 py-4 text-slate-300">{formatPercent(dummyBenchmarks.roe)}</td>
                            <td className="px-5 py-4 text-slate-300">
                              {dummyFundamentals.roe >= dummyBenchmarks.roe ? "Profitabilitas bagus" : "Perlu perhatian"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* tabel data mentah */}
                  <div className="bg-slate-800/35 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-700/60">
                      <p className="text-white font-semibold">Data Mentah (Ringkas)</p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[520px]">
                        <thead>
                          <tr className="bg-slate-900/30 border-b border-slate-700/60">
                            <th className="text-left px-5 py-3 text-sm font-semibold text-slate-300">Metrik</th>
                            <th className="text-left px-5 py-3 text-sm font-semibold text-slate-300">Nilai</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-700/40">
                            <td className="px-5 py-4 text-slate-200 font-medium">Revenue (Pendapatan)</td>
                            <td className="px-5 py-4 text-white font-semibold">{formatIDR(dummyFundamentals.revenue)}</td>
                          </tr>
                          <tr className="border-b border-slate-700/40">
                            <td className="px-5 py-4 text-slate-200 font-medium">Net Income (Laba Bersih)</td>
                            <td className="px-5 py-4 text-white font-semibold">{formatIDR(dummyFundamentals.netIncome)}</td>
                          </tr>
                          <tr className="border-b border-slate-700/40">
                            <td className="px-5 py-4 text-slate-200 font-medium">Total Assets</td>
                            <td className="px-5 py-4 text-white font-semibold">{formatIDR(dummyFundamentals.totalAssets)}</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-4 text-slate-200 font-medium">Total Equity</td>
                            <td className="px-5 py-4 text-white font-semibold">{formatIDR(dummyFundamentals.totalEquity)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="text-sm text-slate-400 leading-relaxed">
                    <span className="font-semibold text-slate-300">Catatan interpretasi:</span>{" "}
                    Label “murah/mahal” di atas menggunakan aturan sederhana berbasis perbandingan benchmark dan bukan analisis profesional.
                  </div>
                </div>
              )}
            </div>
          )}

          {!activeTab && (
            <div className="text-center py-12 text-slate-500">
              Pilih salah satu tab di atas untuk melihat detail
            </div>
          )}
        </div>
      </div>
    </GradientSection>
  );
}