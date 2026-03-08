import { useMemo, useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { TrendingUp, AlertTriangle } from "lucide-react";
import ReactApexChart from "react-apexcharts";

import Button from "@/components/Button";

function formatIDR(n) {
  if (!Number.isFinite(n)) return "Rp 0";
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
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
  epsTTM: 665,
  perTTM: 14.25,
  pbv: 1.85,
  roe: 18.5,
  revenue: 125_500_000_000_000,
  netIncome: 38_200_000_000_000,
  totalAssets: 1_650_000_000_000_000,
  totalEquity: 206_000_000_000_000,
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

        rawCandles.push({
          t: `H${i}`,
          open,
          high,
          low,
          close,
        });
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

  const first = candles[0] || { open: 0 };
  const last = candles[candles.length - 1] || { close: 0 };

  const change = last.close - first.open;
  const pct = first.open === 0 ? 0 : (change / first.open) * 100;

  const timeframeBtnClass = (value) =>
    `rounded-xl px-5 py-2 text-sm font-semibold transition ${
      timeframe === value
        ? "border border-cyan-500/35 bg-cyan-600/25 text-white"
        : "text-slate-300 hover:bg-slate-700/40 hover:text-white"
    }`;

  const tabBtnClass = (tab) =>
    `flex-1 rounded-xl px-6 py-3 text-center font-medium transition ${
      activeTab === tab
        ? "border border-cyan-500/30 bg-cyan-600/30 text-white shadow-sm"
        : "bg-blue-800/50 text-slate-300 hover:bg-slate-700/60"
    }`;

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
            <div class="rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-xl">
              <div class="font-bold text-white">${w.globals.labels[dataPointIndex]}</div>
              <div>Open: <span class="text-emerald-300">${o}</span></div>
              <div>High: <span class="text-cyan-300">${h}</span></div>
              <div>Low: <span class="text-red-300">${l}</span></div>
              <div>Close: <span class="font-bold text-white">${c}</span></div>
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

  const closeToday = last.close;

  const predClose1Mo = useMemo(() => closeToday * 1.08, [closeToday]);
  const predDelta = predClose1Mo - closeToday;
  const predPct = closeToday === 0 ? 0 : (predDelta / closeToday) * 100;

  const trendDirection = predClose1Mo > closeToday ? "Naik" : "Turun";

  const recommendation = useMemo(() => {
    if (predPct > 3) return "BUY";
    if (predPct >= -3 && predPct <= 3) return "HOLD";
    return "SELL";
  }, [predPct]);

  const recommendationPillClass = useMemo(() => {
    if (recommendation === "BUY") {
      return "border-emerald-500/25 bg-emerald-500/15 text-emerald-300";
    }
    if (recommendation === "HOLD") {
      return "border-amber-500/25 bg-amber-500/15 text-amber-300";
    }
    return "border-red-500/25 bg-red-500/15 text-red-300";
  }, [recommendation]);

  const valuation = useMemo(() => {
    const { perTTM, pbv, roe } = dummyFundamentals;
    const perBench = dummyBenchmarks.per;
    const pbvBench = dummyBenchmarks.pbv;
    const roeBench = dummyBenchmarks.roe;

    const perOver = perTTM >= perBench * 1.1;
    const pbvOver = pbv >= pbvBench * 1.1;
    const cheapSignal =
      perTTM <= perBench && pbv <= pbvBench && roe >= roeBench;

    if (cheapSignal) return { label: "Cenderung Murah", tone: "good" };
    if (perOver || pbvOver) return { label: "Cenderung Mahal", tone: "bad" };
    return { label: "Wajar", tone: "mid" };
  }, []);

  const valuationClass =
    valuation.tone === "good"
      ? "border-emerald-500/20 bg-emerald-500/12 text-emerald-200"
      : valuation.tone === "bad"
      ? "border-red-500/20 bg-red-500/12 text-red-200"
      : "border-slate-500/20 bg-slate-500/12 text-slate-200";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/50 via-blue-950/40 to-indigo-950/40 p-8 backdrop-blur-md md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-cyan-400/25 bg-gradient-to-br from-cyan-600/25 to-blue-600/15 md:h-24 md:w-24">
              <TrendingUp className="h-10 w-10 text-cyan-200" />
            </div>

            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                {ticker.toUpperCase()}
              </h1>
              <p className="mt-1 text-xl text-slate-300">
                {dummyCompanyProfile.longName}
              </p>
              <p className="text-lg text-cyan-300/80">
                {dummyCompanyProfile.sector} • {dummyCompanyProfile.industry}
              </p>
            </div>
          </div>

          <div className="min-w-[180px]">
            <p className="text-right text-xs text-slate-300/80">
              Source: yfinance (dummy)
            </p>
            <p className="text-right text-xs text-slate-300/80">
              Harga per tanggal: 06 Maret 2026
            </p>
          </div>
        </div>

        {/* OHLC Info */}
        <div className="mt-8 grid grid-cols-2 gap-4 text-center md:grid-cols-5">
          <div>
            <p className="text-sm text-slate-400">Open</p>
            <p className="text-xl font-semibold text-white">{first.open}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">High</p>
            <p className="text-xl font-semibold text-white">
              {Math.max(...candles.map((c) => c.high))}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Low</p>
            <p className="text-xl font-semibold text-white">
              {Math.min(...candles.map((c) => c.low))}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Close</p>
            <p className="text-xl font-semibold text-white">{last.close}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Perubahan dari Kemarin</p>
            <p
              className={`text-xl font-bold ${
                change >= 0 ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {change >= 0 ? "+" : ""}
              {change.toFixed(0)} ({pct.toFixed(1)}%)
            </p>
          </div>
        </div>

        {/* Timeframe */}
        <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
          {["1D", "1W", "1M", "3M", "1Y"].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTimeframe(value)}
              className={timeframeBtnClass(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/65 p-6 backdrop-blur-md">
      <p className="ml-2.5 text-left text-xs text-slate-200/70">
              Harga per tanggal: 06 Maret 2026
      </p>
        <div ref={chartContainerRef} className="relative h-80 md:h-[420px]">
          {chartReady ? (
            <ReactApexChart
              options={chartOptions}
              series={chartSeries}
              type="candlestick"
              height="100%"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                            Memuat chart...
            </div>
          )}
        </div>
      </div>

      {/* Bottom Tabs */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/65 p-6 backdrop-blur-md">
        <Button
          onClick={() =>
            setActiveTab(activeTab === "prediksi" ? null : "prediksi")
          }
        >
          Prediksi Saham
        </Button>

        <div className="mt-6 mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              setActiveTab(activeTab === "deskripsi" ? null : "deskripsi")
            }
            className={tabBtnClass("deskripsi")}
          >
            Deskripsi Perusahaan
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab(activeTab === "fundamental" ? null : "fundamental")
            }
            className={tabBtnClass("fundamental")}
          >
            Fundamental
          </button>
        </div>

        {activeTab && (
          <div className="mt-4 animate-fade-in">
            {activeTab === "prediksi" && (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-6">
                    <h3 className="mb-3 text-lg font-semibold text-cyan-200">
                      Harga Perkiraan Closing (1 Bulan)
                    </h3>

                    <div className="space-y-2 text-slate-300">
                      <div className="flex items-center justify-between">
                        <span>Harga sekarang (Close)</span>
                        <span className="font-semibold text-white">
                          {formatIDR(closeToday)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Prediksi closing 1 bulan</span>
                        <span className="font-semibold text-white">
                          {formatIDR(predClose1Mo)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Selisih</span>
                        <span
                          className={`font-bold ${
                            predDelta >= 0 ? "text-emerald-300" : "text-red-300"
                          }`}
                        >
                          {predDelta >= 0 ? "+" : ""}
                          {formatIDR(predDelta)} ({predPct >= 0 ? "+" : ""}
                          {predPct.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-6">
                    <h3 className="mb-3 text-lg font-semibold text-cyan-200">
                      Arah Tren & Rekomendasi
                    </h3>

                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-slate-300">Arah tren</span>
                      <span
                        className={`rounded-full border px-4 py-1 font-semibold ${
                          trendDirection === "Naik"
                            ? "border-emerald-500/25 bg-emerald-500/15 text-emerald-300"
                            : "border-red-500/25 bg-red-500/15 text-red-300"
                        }`}
                      >
                        {trendDirection}
                      </span>
                    </div>

                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-slate-300">Rekomendasi</span>
                      <span
                        className={`rounded-full border px-4 py-1 font-semibold ${recommendationPillClass}`}
                      >
                        {recommendation}
                      </span>
                    </div>

                    <p className="text-sm leading-relaxed text-slate-400">
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

                <div className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-5 text-slate-200">
                  <div className="mt-0.5">
                    <AlertTriangle className="h-5 w-5 text-amber-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-200">Disclaimer</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-300/90">
                      Prediksi ini dihasilkan dari model dan bertujuan untuk membantu
                      analisis menggunakan fundamental perusahaan. Hasil prediksi
                      <span className="font-semibold"> bukan</span> kepastian dan tidak
                      dapat dijadikan satu-satunya dasar keputusan investasi.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "deskripsi" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-6">
                  <h3 className="mb-4 text-xl font-semibold text-white">
                    Profil Perusahaan
                  </h3>

                  <div className="grid gap-4 text-slate-300 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Nama (Long)</span>
                        <span className="text-right font-semibold text-white">
                          {dummyCompanyProfile.longName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Nama (Short)</span>
                        <span className="font-semibold text-white">
                          {dummyCompanyProfile.shortName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Sektor</span>
                        <span className="font-semibold text-white">
                          {dummyCompanyProfile.sector}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Industri</span>
                        <span className="font-semibold text-white">
                          {dummyCompanyProfile.industry}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Website</span>
                        <a
                          className="text-right text-cyan-200 underline underline-offset-4 hover:text-cyan-100"
                          href={dummyCompanyProfile.website}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {dummyCompanyProfile.website.replace("https://", "")}
                        </a>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Kota</span>
                        <span className="font-semibold text-white">
                          {dummyCompanyProfile.city}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Negara</span>
                        <span className="font-semibold text-white">
                          {dummyCompanyProfile.country}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-6">
                  <h3 className="mb-3 text-xl font-semibold text-white">
                    Ringkasan Bisnis
                  </h3>
                  <p className="leading-relaxed text-slate-300">
                    {dummyCompanyProfile.longBusinessSummary}
                  </p>
                </div>
              </div>
            )}

            {activeTab === "fundamental" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <h3 className="text-xl font-semibold text-white">Fundamental</h3>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 ${valuationClass}`}
                  >
                    <span className="text-sm">Interpretasi:</span>
                    <span className="font-semibold">{valuation.label}</span>
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/35">
                  <div className="border-b border-slate-700/60 px-5 py-4">
                    <p className="font-semibold text-white">Rasio Utama</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px]">
                      <thead>
                        <tr className="border-b border-slate-700/60 bg-slate-900/30">
                          <th className="px-5 py-3 text-left text-sm font-semibold text-slate-300">
                            Metrik
                          </th>
                          <th className="px-5 py-3 text-left text-sm font-semibold text-slate-300">
                            Nilai
                          </th>
                          <th className="px-5 py-3 text-left text-sm font-semibold text-slate-300">
                            Benchmark
                          </th>
                          <th className="px-5 py-3 text-left text-sm font-semibold text-slate-300">
                            Keterangan
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        <tr className="border-b border-slate-700/40">
                          <td className="px-5 py-4 font-medium text-slate-200">
                            EPS (TTM)
                          </td>
                          <td className="px-5 py-4 font-semibold text-white">
                            {formatIDR(dummyFundamentals.epsTTM)}
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {formatIDR(dummyBenchmarks.eps)}
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {dummyFundamentals.epsTTM >= dummyBenchmarks.eps
                              ? "Di atas benchmark"
                              : "Di bawah benchmark"}
                          </td>
                        </tr>

                        <tr className="border-b border-slate-700/40">
                          <td className="px-5 py-4 font-medium text-slate-200">
                            PER (TTM)
                          </td>
                          <td className="px-5 py-4 font-semibold text-white">
                            {dummyFundamentals.perTTM.toFixed(2)}x
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {dummyBenchmarks.per.toFixed(2)}x
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {dummyFundamentals.perTTM <= dummyBenchmarks.per
                              ? "Relatif lebih murah"
                              : "Relatif lebih mahal"}
                          </td>
                        </tr>

                        <tr className="border-b border-slate-700/40">
                          <td className="px-5 py-4 font-medium text-slate-200">
                            PBV
                          </td>
                          <td className="px-5 py-4 font-semibold text-white">
                            {dummyFundamentals.pbv.toFixed(2)}x
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {dummyBenchmarks.pbv.toFixed(2)}x
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {dummyFundamentals.pbv <= dummyBenchmarks.pbv
                              ? "Lebih rendah dari benchmark"
                              : "Lebih tinggi dari benchmark"}
                          </td>
                        </tr>

                        <tr>
                          <td className="px-5 py-4 font-medium text-slate-200">
                            ROE
                          </td>
                          <td className="px-5 py-4 font-semibold text-white">
                            {formatPercent(dummyFundamentals.roe)}
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {formatPercent(dummyBenchmarks.roe)}
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {dummyFundamentals.roe >= dummyBenchmarks.roe
                              ? "Profitabilitas bagus"
                              : "Perlu perhatian"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/35">
                  <div className="border-b border-slate-700/60 px-5 py-4">
                    <p className="font-semibold text-white">Data Mentah (Ringkas)</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px]">
                      <thead>
                        <tr className="border-b border-slate-700/60 bg-slate-900/30">
                          <th className="px-5 py-3 text-left text-sm font-semibold text-slate-300">
                            Metrik
                          </th>
                          <th className="px-5 py-3 text-left text-sm font-semibold text-slate-300">
                            Nilai
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        <tr className="border-b border-slate-700/40">
                          <td className="px-5 py-4 font-medium text-slate-200">
                            Revenue (Pendapatan)
                          </td>
                          <td className="px-5 py-4 font-semibold text-white">
                            {formatIDR(dummyFundamentals.revenue)}
                          </td>
                        </tr>

                        <tr className="border-b border-slate-700/40">
                          <td className="px-5 py-4 font-medium text-slate-200">
                            Net Income (Laba Bersih)
                          </td>
                          <td className="px-5 py-4 font-semibold text-white">
                            {formatIDR(dummyFundamentals.netIncome)}
                          </td>
                        </tr>

                        <tr className="border-b border-slate-700/40">
                          <td className="px-5 py-4 font-medium text-slate-200">
                            Total Assets
                          </td>
                          <td className="px-5 py-4 font-semibold text-white">
                            {formatIDR(dummyFundamentals.totalAssets)}
                          </td>
                        </tr>

                        <tr>
                          <td className="px-5 py-4 font-medium text-slate-200">
                            Total Equity
                          </td>
                          <td className="px-5 py-4 font-semibold text-white">
                            {formatIDR(dummyFundamentals.totalEquity)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="text-sm leading-relaxed text-slate-400">
                  <span className="font-semibold text-slate-300">
                    Catatan interpretasi:
                  </span>{" "}
                  Label “murah/mahal” di atas menggunakan aturan sederhana berbasis
                  perbandingan benchmark dan bukan analisis profesional.
                </div>
              </div>
            )}
          </div>
        )}

        {!activeTab && (
          <div className="py-12 text-center text-slate-500">
            Pilih salah satu tab di atas untuk melihat detail
          </div>
        )}
      </div>
    </div>
  );
}