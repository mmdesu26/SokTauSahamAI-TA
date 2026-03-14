import { useMemo, useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { TrendingUp, AlertTriangle } from "lucide-react";
import ReactApexChart from "react-apexcharts";

import Button from "@/components/Button";
import { apiFetch } from "@/lib/api";

function formatIDR(n) {
  if (!Number.isFinite(Number(n))) return "Rp 0";
  return `Rp ${Math.round(Number(n)).toLocaleString("id-ID")}`;
}

function formatPercent(n) {
  if (!Number.isFinite(Number(n))) return "0%";
  return `${Number(n).toFixed(1)}%`;
}

export default function InvestorStockDetail() {
  const { ticker = "" } = useParams();

  const [timeframe, setTimeframe] = useState("1D");
  const [activeTab, setActiveTab] = useState(null);
  const [chartReady, setChartReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [stockData, setStockData] = useState(null);

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

  useEffect(() => {
    const fetchStockDetail = async () => {
      setIsLoading(true);

      const { ok, data } = await apiFetch(`/stocks/${ticker}/detail?timeframe=${timeframe}`);

      if (ok && data.success) {
        setStockData(data.data);
      } else {
        setStockData(null);
      }

      setIsLoading(false);
    };

    if (ticker) {
      fetchStockDetail();
    }
  }, [ticker, timeframe]);

  const profile = stockData?.profile || {};
  const fundamental = stockData?.fundamental || {};
  const chart = stockData?.chart || [];
  const stock = stockData?.stock || {};

  const candles = useMemo(
    () =>
      chart.map((c) => ({
        t: String(c.t),
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
      })),
    [chart]
  );

  const first = candles[0] || { open: 0 };
  const last = candles[candles.length - 1] || { close: 0 };

  const change = Number(last.close || 0) - Number(first.open || 0);
  const pct = Number(first.open || 0) === 0 ? 0 : (change / Number(first.open || 0)) * 100;

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

  const closeToday = Number(last.close || 0);
  const predClose1Mo = closeToday * 1.08;
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

  const benchmarks = fundamental?.benchmarks || {};

  const valuation = useMemo(() => {
    const perTTM = Number(fundamental?.perTTM || 0);
    const pbv = Number(fundamental?.pbv || 0);
    const roe = Number(fundamental?.roe || 0);

    const perBench = Number(benchmarks?.per || 0);
    const pbvBench = Number(benchmarks?.pbv || 0);
    const roeBench = Number(benchmarks?.roe || 0);

    const perOver = perBench > 0 ? perTTM >= perBench * 1.1 : false;
    const pbvOver = pbvBench > 0 ? pbv >= pbvBench * 1.1 : false;
    const cheapSignal =
      perBench > 0 &&
      pbvBench > 0 &&
      roeBench > 0 &&
      perTTM <= perBench &&
      pbv <= pbvBench &&
      roe >= roeBench;

    if (cheapSignal) return { label: "Cenderung Murah", tone: "good" };
    if (perOver || pbvOver) return { label: "Cenderung Mahal", tone: "bad" };
    return { label: "Wajar", tone: "mid" };
  }, [fundamental, benchmarks]);

  const valuationClass =
    valuation.tone === "good"
      ? "border-emerald-500/20 bg-emerald-500/12 text-emerald-200"
      : valuation.tone === "bad"
      ? "border-red-500/20 bg-red-500/12 text-red-200"
      : "border-slate-500/20 bg-slate-500/12 text-slate-200";

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-12 text-center text-slate-400">
        Memuat detail saham...
      </div>
    );
  }

  if (!stockData) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-12 text-center text-slate-400">
        Data detail saham tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
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
                {profile.longName || stock.name}
              </p>
              <p className="text-lg text-cyan-300/80">
                {profile.sector || stock.sector} • {profile.industry || "-"}
              </p>
            </div>
          </div>

          <div className="min-w-[180px]">
            <p className="text-right text-xs text-slate-300/80">Source: Database Internal</p>
            <p className="text-right text-xs text-slate-300/80">
              Harga update: {stock.lastUpdated || "-"}
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 text-center md:grid-cols-5">
          <div>
            <p className="text-sm text-slate-400">Open</p>
            <p className="text-xl font-semibold text-white">{first.open}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">High</p>
            <p className="text-xl font-semibold text-white">
              {candles.length ? Math.max(...candles.map((c) => c.high)) : 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Low</p>
            <p className="text-xl font-semibold text-white">
              {candles.length ? Math.min(...candles.map((c) => c.low)) : 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Close</p>
            <p className="text-xl font-semibold text-white">{last.close}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Perubahan</p>
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

      <div className="rounded-3xl border border-slate-800 bg-slate-900/65 p-6 backdrop-blur-md">
        <p className="ml-2.5 text-left text-xs text-slate-200/70">
          Harga update: {stock.lastUpdated || "-"}
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
                      Prediksi ini dihasilkan dari model sederhana dan bertujuan membantu analisis.
                      Hasil prediksi bukan kepastian dan tidak bisa dijadikan satu-satunya dasar keputusan investasi.
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
                          {profile.longName || "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Nama (Short)</span>
                        <span className="font-semibold text-white">
                          {profile.shortName || "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Sektor</span>
                        <span className="font-semibold text-white">
                          {profile.sector || "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Industri</span>
                        <span className="font-semibold text-white">
                          {profile.industry || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Website</span>
                        {profile.website ? (
                          <a
                            className="text-right text-cyan-200 underline underline-offset-4 hover:text-cyan-100"
                            href={profile.website}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {profile.website.replace("https://", "")}
                          </a>
                        ) : (
                          <span className="font-semibold text-white">-</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Kota</span>
                        <span className="font-semibold text-white">
                          {profile.city || "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Negara</span>
                        <span className="font-semibold text-white">
                          {profile.country || "-"}
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
                    {profile.longBusinessSummary || "-"}
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
                          <th className="px-5 py-3 text-left text-sm font-semibold text-slate-300">Metrik</th>
                          <th className="px-5 py-3 text-left text-sm font-semibold text-slate-300">Nilai</th>
                          <th className="px-5 py-3 text-left text-sm font-semibold text-slate-300">Benchmark</th>
                          <th className="px-5 py-3 text-left text-sm font-semibold text-slate-300">Keterangan</th>
                        </tr>
                      </thead>

                      <tbody>
                        <tr className="border-b border-slate-700/40">
                          <td className="px-5 py-4 font-medium text-slate-200">EPS (TTM)</td>
                          <td className="px-5 py-4 font-semibold text-white">
                            {formatIDR(fundamental.epsTTM)}
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {formatIDR(benchmarks.eps)}
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {Number(fundamental.epsTTM || 0) >= Number(benchmarks.eps || 0)
                              ? "Di atas benchmark"
                              : "Di bawah benchmark"}
                          </td>
                        </tr>

                        <tr className="border-b border-slate-700/40">
                          <td className="px-5 py-4 font-medium text-slate-200">PER (TTM)</td>
                          <td className="px-5 py-4 font-semibold text-white">
                            {Number(fundamental.perTTM || 0).toFixed(2)}x
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {Number(benchmarks.per || 0).toFixed(2)}x
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {Number(fundamental.perTTM || 0) <= Number(benchmarks.per || 0)
                              ? "Relatif lebih murah"
                              : "Relatif lebih mahal"}
                          </td>
                        </tr>

                        <tr className="border-b border-slate-700/40">
                          <td className="px-5 py-4 font-medium text-slate-200">PBV</td>
                          <td className="px-5 py-4 font-semibold text-white">
                            {Number(fundamental.pbv || 0).toFixed(2)}x
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {Number(benchmarks.pbv || 0).toFixed(2)}x
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {Number(fundamental.pbv || 0) <= Number(benchmarks.pbv || 0)
                              ? "Lebih rendah dari benchmark"
                              : "Lebih tinggi dari benchmark"}
                          </td>
                        </tr>

                        <tr>
                          <td className="px-5 py-4 font-medium text-slate-200">ROE</td>
                          <td className="px-5 py-4 font-semibold text-white">
                            {formatPercent(fundamental.roe)}
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {formatPercent(benchmarks.roe)}
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {Number(fundamental.roe || 0) >= Number(benchmarks.roe || 0)
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
                          <th className="px-5 py-3 text-left text-sm font-semibold text-slate-300">Metrik</th>
                          <th className="px-5 py-3 text-left text-sm font-semibold text-slate-300">Nilai</th>
                        </tr>
                      </thead>

                      <tbody>
                        <tr className="border-b border-slate-700/40">
                          <td className="px-5 py-4 font-medium text-slate-200">Revenue (Pendapatan)</td>
                          <td className="px-5 py-4 font-semibold text-white">
                            {formatIDR(fundamental.revenue)}
                          </td>
                        </tr>

                        <tr className="border-b border-slate-700/40">
                          <td className="px-5 py-4 font-medium text-slate-200">Net Income (Laba Bersih)</td>
                          <td className="px-5 py-4 font-semibold text-white">
                            {formatIDR(fundamental.netIncome)}
                          </td>
                        </tr>

                        <tr className="border-b border-slate-700/40">
                          <td className="px-5 py-4 font-medium text-slate-200">Total Assets</td>
                          <td className="px-5 py-4 font-semibold text-white">
                            {formatIDR(fundamental.totalAssets)}
                          </td>
                        </tr>

                        <tr>
                          <td className="px-5 py-4 font-medium text-slate-200">Total Equity</td>
                          <td className="px-5 py-4 font-semibold text-white">
                            {formatIDR(fundamental.totalEquity)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="text-sm leading-relaxed text-slate-400">
                  <span className="font-semibold text-slate-300">Catatan interpretasi:</span>{" "}
                  Label “murah/mahal” menggunakan aturan sederhana berbasis perbandingan benchmark dan bukan analisis profesional.
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