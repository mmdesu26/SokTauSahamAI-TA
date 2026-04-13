import { useMemo, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, Building } from "lucide-react";
import { getCompanyLogo } from "@/utils/logoHelper";
import Button from "@/components/Button";
import StockCandleChart from "@/components/StockCandleChart";
import { apiFetch } from "@/lib/api";

function formatIDR(n) {
  if (!Number.isFinite(Number(n))) return "Rp 0";
  return `Rp ${Math.round(Number(n)).toLocaleString("id-ID")}`;
}

function formatPercent(n) {
  if (!Number.isFinite(Number(n))) return "0.0%";
  return `${Number(n).toFixed(1)}%`;
}

function parseLocalDateTime(value) {
  if (!value) return null;

  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const date = new Date(normalized);

  if (!Number.isNaN(date.getTime())) {
    return date;
  }

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;

  const [, year, month, day, hour, minute, second = "0"] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );
}

function formatLocalDate(value) {
  const date = parseLocalDateTime(value);
  if (!date) return value || "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatLocalDateTime(value) {
  const date = parseLocalDateTime(value);
  if (!date) return value || "-";

  return `${new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)} WIB`;
}

function formatChartUpdate(value, timeframe) {
  if (!value) return "-";
  return timeframe === "1D" ? formatLocalDateTime(value) : formatLocalDate(value);
}

function formatChartIntervalLabel(interval, timeframe) {
  if (timeframe === "1D") return "Per jam";
  if (timeframe === "7D") return "Per hari (7 hari)";
  if (timeframe === "1M") return "Per hari (1 bulan)";
  return interval || "-";
}

export default function InvestorStockDetail() {
  const { ticker = "" } = useParams();

  const [timeframe, setTimeframe] = useState("1D");
  const [activeTab, setActiveTab] = useState("deskripsi");

  const [isLoading, setIsLoading] = useState(true);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isFundamentalsLoading, setIsFundamentalsLoading] = useState(false);

  const [stockData, setStockData] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [fundamentalsData, setFundamentalsData] = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setActiveTab("deskripsi");

    const fetchStockDetail = async () => {
      setIsLoading(true);

      try {
        const detailRes = await apiFetch(`/stocks/${ticker}/detail?timeframe=${timeframe}`);
        const chartRes = await apiFetch(`/stocks/${ticker}/candlestick?timeframe=${timeframe}`);

        if (detailRes.ok && detailRes.data?.success) {
          const nextData = detailRes.data.data || {};

          nextData.chart =
            chartRes.ok && chartRes.data?.success
              ? chartRes.data.data || []
              : nextData.chart || [];

          nextData.chartMeta =
            chartRes.ok && chartRes.data?.success
              ? {
                  source: chartRes.data.source || nextData.chartMeta?.source || "yfinance",
                  latestDate: chartRes.data.latestDate || nextData.chartMeta?.latestDate || null,
                  latestUpdated:
                    chartRes.data.latestUpdated || nextData.chartMeta?.latestUpdated || null,
                  interval: chartRes.data.interval || nextData.chartMeta?.interval || "60m",
                }
              : nextData.chartMeta || null;

          setStockData(nextData);
        } else {
          setStockData(null);
        }
      } catch (error) {
        console.error("Error fetching stock detail:", error);
        setStockData(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (ticker) fetchStockDetail();
  }, [ticker, timeframe]);

  const handlePrediction = async () => {
    if (!ticker) return;

    setIsPredicting(true);

    try {
      const { ok, data } = await apiFetch(`/stocks/${ticker}/prediction`);
      setPredictionData(ok && data.success ? data.data : null);
    } catch (error) {
      console.error("Error fetching prediction:", error);
      setPredictionData(null);
    } finally {
      setIsPredicting(false);
    }
  };

  const handleFundamentalsLoad = async () => {
    if (!ticker) return;

    setIsFundamentalsLoading(true);

    try {
      const { ok, data } = await apiFetch(`/stocks/${ticker}/fundamentals`);
      setFundamentalsData(ok && data.success ? data.data : null);
    } catch (error) {
      console.error("Error fetching fundamentals:", error);
      setFundamentalsData(null);
    } finally {
      setIsFundamentalsLoading(false);
    }
  };

  const profile = stockData?.profile || {};
  const fundamental = stockData?.fundamental || {};
  const chart = stockData?.chart || [];
  const chartMeta = stockData?.chartMeta || {};
  const logoUrl = getCompanyLogo(profile.website);

  const candles = useMemo(() => {
    return chart.map((c) => ({
      t: String(c.t),
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close),
    }));
  }, [chart]);

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

  const closeToday = predictionData?.current_price || Number(last.close || 0);
  const closeTodayDate = predictionData?.current_price_date || "-";
  const predCloseNextDay = predictionData?.predicted_close_next_day || closeToday;
  const predDelta = predCloseNextDay - closeToday;

  const pricePredPct =
    predictionData?.price_expected_change_pct ??
    (closeToday === 0 ? 0 : (predDelta / closeToday) * 100);

  const mape = predictionData?.mape || 0;

  const fundamentalPrediction = predictionData?.fundamental_prediction || {};
  const fundamentalReturn3M = Number(fundamentalPrediction?.estimated_return_pct_3m || 0);
  const fundamentalDirection = fundamentalPrediction?.direction_3m || "Netral";
  const recommendation = fundamentalPrediction?.recommendation || "HOLD";

  const recommendationPillClass = useMemo(() => {
    if (recommendation === "BUY") {
      return "border-emerald-500/25 bg-emerald-500/15 text-emerald-300";
    }
    if (recommendation === "HOLD") {
      return "border-amber-500/25 bg-amber-500/15 text-amber-300";
    }
    return "border-red-500/25 bg-red-500/15 text-red-300";
  }, [recommendation]);

  const fundamentalsRatios = fundamentalsData?.fundamentals?.ratios || {};
  const fundamentalsRawData = fundamentalsData?.fundamentals?.rawData || {};
  const benchmarks = fundamental?.benchmarks || {};

  const valuation = useMemo(() => {
    const perTTM = Number(fundamental?.perTTM || 0);
    const pbv = Number(fundamental?.pbv || 0);
    const roe = Number(fundamental?.roe || 0);

    const perBench = Number(benchmarks?.per || 0);
    const pbvBench = Number(benchmarks?.pbv || 0);
    const roeBench = Number(benchmarks?.roe || 0);

    const cheapSignal =
      perBench > 0 &&
      pbvBench > 0 &&
      roeBench > 0 &&
      perTTM <= perBench &&
      pbv <= pbvBench &&
      roe >= roeBench;

    if (cheapSignal) return { label: "Cenderung Murah", tone: "good" };

    if (
      perBench > 0 &&
      pbvBench > 0 &&
      (perTTM >= perBench * 1.1 || pbv >= pbvBench * 1.1)
    ) {
      return { label: "Cenderung Mahal", tone: "bad" };
    }

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
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-cyan-400/25 bg-gradient-to-br from-cyan-600/25 to-blue-600/15 md:h-24 md:w-24">
              {logoUrl && !imgError ? (
                <img
                  src={logoUrl}
                  alt={profile.longName || "-"}
                  className="h-full w-full object-contain bg-white p-1"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-cyan-300">
                  <Building className="h-10 w-10" />
                </div>
              )}
            </div>

            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                {ticker.toUpperCase()}
              </h1>
              <p className="mt-1 text-xl text-slate-300">{profile.longName || "-"}</p>
              <p className="text-lg text-cyan-300/80">
                {profile.sector || "-"} • {profile.industry || "-"}
              </p>
            </div>
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
            <p className={`text-xl font-bold ${change >= 0 ? "text-emerald-300" : "text-red-300"}`}>
              {change >= 0 ? "+" : ""}
              {change.toFixed(0)} ({formatPercent(pct)})
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
          {["1D", "7D", "1M"].map((value) => (
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
          Source: {chartMeta.source || "yfinance"} • Interval:{" "}
          {formatChartIntervalLabel(chartMeta.interval, timeframe)} • Update terbaru:{" "}
          {formatChartUpdate(chartMeta.latestUpdated || chartMeta.latestDate, timeframe)}
        </p>
        <p className="ml-2.5 mt-1 text-left text-xs text-amber-200/90">
          Data ini bukan harga realtime dan grafik hanya visualisasi historis dari yfinance, bukan harga prediksi.
        </p>

        <div className="relative h-80 md:h-[420px]">
          {candles.length ? (
            <StockCandleChart data={candles} timeframe={timeframe} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
              Tidak ada data candlestick OHLC terbaru.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/65 p-6 backdrop-blur-md">
        <Button
          onClick={() => {
            if (activeTab === "prediksi") {
              setActiveTab(null);
            } else {
              setActiveTab("prediksi");
              if (!predictionData) handlePrediction();
            }
          }}
          disabled={isPredicting}
        >
          {isPredicting ? "Memproses Prediksi..." : "Prediksi Saham"}
        </Button>

        <div className="mt-6 mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === "deskripsi" ? null : "deskripsi")}
            className={tabBtnClass("deskripsi")}
          >
            Deskripsi Perusahaan
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeTab === "fundamental") {
                setActiveTab(null);
              } else {
                setActiveTab("fundamental");
                if (!fundamentalsData) handleFundamentalsLoad();
              }
            }}
            className={tabBtnClass("fundamental")}
            disabled={isFundamentalsLoading}
          >
            {isFundamentalsLoading ? "Memuat..." : "Fundamental"}
          </button>
        </div>

        {activeTab && (
          <div className="mt-4 animate-fade-in">
            {activeTab === "prediksi" && (
              <div className="space-y-6">
                {isPredicting ? (
                  <div className="py-12 text-center text-slate-400">
                    Menjalankan model harga (Random Forest + Linear Regression) dan analisis fundamental 3 bulan...
                  </div>
                ) : !predictionData ? (
                  <div className="py-12 text-center text-slate-400">
                    <p>Prediksi belum dijalankan</p>
                    <button
                      onClick={handlePrediction}
                      className="mt-4 rounded-lg bg-cyan-600/30 px-6 py-2 text-cyan-200 transition hover:bg-cyan-600/40"
                    >
                      Jalankan Prediksi Sekarang
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 px-6 py-4 text-center">
                      <h2 className="text-xl font-bold text-cyan-200 md:text-2xl">
                        Hasil Prediksi Harga Closing Besok dan Arah Tren 3 Bulan ke Depan
                      </h2>
                      <h2 className="text-xl text-cyan-100 md:text-1xl">
                       (Disarankan melakukan prediksi sebelum market buka 
                       keesokan hari agar menggunakan harga penutupan harian terbaru yang sudah final)
                      </h2>
                    </div>

                    <div className="flex w-full flex-col gap-6">
                      <div className="w-full rounded-xl border border-slate-700 bg-slate-800/40 p-6">
                        <h3 className="mb-4 text-lg font-semibold text-cyan-200 text-center">
                          Harga Perkiraan Closing
                        </h3>

                        <div className="space-y-3 text-slate-300">
                          <div className="flex items-center justify-between gap-4">
                            <span>Close terakhir (data model)</span>
                            <span className="text-right font-semibold text-white">
                              {formatIDR(closeToday)}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 mt-2">
                            * Menggunakan harga penutupan harian terakhir yang sudah completed dari data historis.
                          </p>

                          <div className="flex items-center justify-between gap-4">
                            <span>Tanggal close data model</span>
                            <span className="text-right font-semibold text-white">
                              {closeTodayDate}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <span>Harga saat ini (chart)</span>
                            <span className="text-right font-semibold text-white">
                              {formatIDR(Number(last.close || 0))}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <span>Prediksi closing besok</span>
                            <span className="text-right font-semibold text-white">
                              {formatIDR(predCloseNextDay)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <span>Selisih terhadap close data model</span>
                            <span
                              className={`text-right font-bold ${
                                predDelta >= 0 ? "text-emerald-300" : "text-red-300"
                              }`}
                            >
                              {predDelta >= 0 ? "+" : ""}
                              {formatIDR(predDelta)} ({pricePredPct >= 0 ? "+" : ""}
                              {pricePredPct.toFixed(2)}%)
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <span>Random Forest</span>
                            <span className="text-right font-semibold text-white">
                              {formatIDR(predictionData?.rf_prediction)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <span>Linear Regression</span>
                            <span className="text-right font-semibold text-white">
                              {formatIDR(predictionData?.lr_prediction)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="w-full rounded-xl border border-slate-700 bg-slate-800/40 p-6">
                        <h3 className="mb-4 text-lg font-semibold text-cyan-200 text-center">
                          Arah Tren & Rekomendasi 3 Bulan ke Depan
                        </h3>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-300">Return 3 bulan (fundamental)</span>
                            <span
                              className={`rounded-full border px-4 py-1 font-semibold ${
                                fundamentalReturn3M >= 0
                                  ? "border-emerald-500/25 bg-emerald-500/15 text-emerald-300"
                                  : "border-red-500/25 bg-red-500/15 text-red-300"
                              }`}
                            >
                              {fundamentalReturn3M >= 0 ? "+" : ""}
                              {fundamentalReturn3M.toFixed(2)}%
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-300">Arah 3 bulan (fundamental)</span>
                            <span
                              className={`rounded-full border px-4 py-1 font-semibold ${
                                fundamentalDirection === "Naik"
                                  ? "border-emerald-500/25 bg-emerald-500/15 text-emerald-300"
                                  : "border-red-500/25 bg-red-500/15 text-red-300"
                              }`}
                            >
                              {fundamentalDirection}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-300">Rekomendasi fundamental</span>
                            <span
                              className={`rounded-full border px-4 py-1 font-semibold ${recommendationPillClass}`}
                            >
                              {recommendation}
                            </span>
                          </div>

                          <div className="space-y-2 pt-2 text-sm leading-relaxed text-slate-400">
                            <p>Model harga: Random Forest + Linear Regression</p>
                            <p>Input model harga: lag closing price historis</p>
                            <p>Analisis fundamental: EPS, PER, PBV, ROE</p>
                          </div>
                        </div>
                      </div>

                      <div className="w-full rounded-xl border border-slate-700 bg-slate-800/40 p-6">
                        <h3 className="mb-4 text-center text-lg font-semibold text-cyan-200">
                          Akurasi Prediksi Model Harga
                        </h3>

                        <div className="space-y-3 text-slate-300">
                          <div className="flex items-center justify-between gap-4">
                            <span>MAPE</span>
                            <span className="text-right font-semibold text-white">
                              {mape.toFixed(2)}%
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <span>Waktu Prediksi</span>
                            <span className="text-right font-semibold text-white">
                              {predictionData?.prediction_date || "-"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 rounded-lg border border-slate-700/60 bg-slate-900/30 p-4 text-sm leading-relaxed text-slate-400">
                          <p className="font-medium text-slate-300">Cara baca akurasi</p>
                          <p className="mt-2">
                            MAPE menunjukkan rata-rata persentase error prediksi terhadap harga aktual.
                          </p>
                          <p className="mt-1">
                            Semakin kecil nilai MAPE, maka prediksi model semakin baik.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-5 text-slate-200">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />

                        <div>
                          <p className="font-semibold text-amber-200">Disclaimer</p>
                          <p className="mt-1 text-sm leading-relaxed text-slate-300/90">
                            Sistem ini memisahkan model harga dan analisis fundamental. Prediksi harga
                            dibuat dengan Random Forest dan Linear Regression berbasis histori closing,
                            sedangkan return 3 bulan, arah, dan rekomendasi berasal dari analisis
                            fundamental EPS, PER, PBV, dan ROE. Hasil bukan kepastian dan bukan
                            rekomendasi investasi.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "deskripsi" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-6">
                  <h3 className="mb-4 text-xl font-semibold text-white text-center">
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
                        <span className="text-right font-semibold text-white">
                          {profile.shortName || "-"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Sektor</span>
                        <span className="text-right font-semibold text-white">
                          {profile.sector || "-"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Industri</span>
                        <span className="text-right font-semibold text-white">
                          {profile.industry || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Website</span>
                        {profile.website ? (
                          <a
                            href={profile.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-right text-cyan-200 underline hover:text-cyan-100"
                          >
                            {profile.website.replace("https://", "")}
                          </a>
                        ) : (
                          <span className="font-semibold text-white">-</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Kota</span>
                        <span className="text-right font-semibold text-white">
                          {profile.city || "-"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Negara</span>
                        <span className="text-right font-semibold text-white">
                          {profile.country || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-6">
                  <h3 className="mb-3 text-xl font-semibold text-white text-center">
                    Ringkasan Bisnis
                  </h3>
                  <p className="leading-relaxed text-slate-300 text-justify">
                    {profile.longBusinessSummary ||
                      "Ringkasan bisnis belum tersedia dalam Bahasa Indonesia."}
                  </p>
                </div>
              </div>
            )}

            {activeTab === "fundamental" && (
              <div className="space-y-6 text-center">
                {isFundamentalsLoading ? (
                  <div className="py-12 text-center text-slate-400">
                    Memuat data fundamental dari yfinance API...
                  </div>
                ) : !fundamentalsData ? (
                  <div className="py-12 text-center text-slate-400">
                    <p>Data fundamental belum dimuat</p>
                    <button
                      onClick={handleFundamentalsLoad}
                      className="mt-4 rounded-lg bg-cyan-600/30 px-6 py-2 text-cyan-200 transition hover:bg-cyan-600/40"
                    >
                      Muat Data Fundamental
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center justify-center gap-3">
                      <h3 className="text-xl font-semibold text-white">
                        Fundamental
                      </h3>

                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 ${valuationClass}`}
                      >
                        <span className="text-sm">Interpretasi:</span>
                        <span className="font-semibold">{valuation.label}</span>
                      </span>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/35">
                      <div className="border-b border-slate-700/60 px-5 py-4 text-center">
                        <p className="font-semibold text-white">Rasio Fundamental</p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-center">
                          <thead>
                            <tr className="border-b border-slate-700/60 bg-slate-900/30">
                              <th className="px-5 py-3 text-center text-sm font-semibold text-slate-300">
                                Metrik
                              </th>
                              <th className="px-5 py-3 text-center text-sm font-semibold text-slate-300">
                                Nilai
                              </th>
                              <th className="px-5 py-3 text-center text-sm font-semibold text-slate-300">
                                Interpretasi
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            <tr className="border-b border-slate-700/40">
                              <td className="px-5 py-4 font-medium text-slate-200">EPS</td>
                              <td className="px-5 py-4 font-semibold text-white">
                                {fundamentalsRatios.eps ? formatIDR(fundamentalsRatios.eps) : "-"}
                              </td>
                              <td className="px-5 py-4 text-slate-300">
                                Pendapatan per lembar saham
                              </td>
                            </tr>

                            <tr className="border-b border-slate-700/40">
                              <td className="px-5 py-4 font-medium text-slate-200">PER</td>
                              <td className="px-5 py-4 font-semibold text-white">
                                {fundamentalsRatios.pe
                                  ? `${Number(fundamentalsRatios.pe).toFixed(2)}x`
                                  : "-"}
                              </td>
                              <td className="px-5 py-4 text-slate-300">
                                {fundamentalsRatios.pe && Number(fundamentalsRatios.pe) < 15
                                  ? "Murah"
                                  : fundamentalsRatios.pe && Number(fundamentalsRatios.pe) > 25
                                  ? "Mahal"
                                  : "Wajar"}
                              </td>
                            </tr>

                            <tr className="border-b border-slate-700/40">
                              <td className="px-5 py-4 font-medium text-slate-200">PBV</td>
                              <td className="px-5 py-4 font-semibold text-white">
                                {fundamentalsRatios.pbv
                                  ? `${Number(fundamentalsRatios.pbv).toFixed(2)}x`
                                  : "-"}
                              </td>
                              <td className="px-5 py-4 text-slate-300">
                                {fundamentalsRatios.pbv && Number(fundamentalsRatios.pbv) < 1
                                  ? "Undervalued"
                                  : "Normal"}
                              </td>
                            </tr>

                            <tr>
                              <td className="px-5 py-4 font-medium text-slate-200">ROE</td>
                              <td className="px-5 py-4 font-semibold text-white">
                                {fundamentalsRatios.roe
                                  ? `${Number(fundamentalsRatios.roe).toFixed(2)}%`
                                  : "-"}
                              </td>
                              <td className="px-5 py-4 text-slate-300">
                                {fundamentalsRatios.roe && Number(fundamentalsRatios.roe) > 15
                                  ? "Profitable"
                                  : "Perlu dikaji"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/35">
                      <div className="border-b border-slate-700/60 px-5 py-4 text-center">
                        <p className="font-semibold text-white">Data Mentah</p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[520px] text-center">
                          <thead>
                            <tr className="border-b border-slate-700/60 bg-slate-900/30">
                              <th className="px-5 py-3 text-center text-sm font-semibold text-slate-300">
                                Metrik
                              </th>
                              <th className="px-5 py-3 text-center text-sm font-semibold text-slate-300">
                                Nilai
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            <tr className="border-b border-slate-700/40">
                              <td className="px-5 py-4 font-medium text-slate-200">
                                Harga Saat Ini
                              </td>
                              <td className="px-5 py-4 font-semibold text-white">
                                {formatIDR(fundamentalsRawData.currentPrice)}
                              </td>
                            </tr>

                            <tr className="border-b border-slate-700/40">
                              <td className="px-5 py-4 font-medium text-slate-200">
                                Book Value Per Share
                              </td>
                              <td className="px-5 py-4 font-semibold text-white">
                                {formatIDR(fundamentalsRawData.bookValuePerShare)}
                              </td>
                            </tr>

                            <tr className="border-b border-slate-700/40">
                              <td className="px-5 py-4 font-medium text-slate-200">Revenue</td>
                              <td className="px-5 py-4 font-semibold text-white">
                                {formatIDR(fundamentalsRawData.revenue)}
                              </td>
                            </tr>

                            <tr className="border-b border-slate-700/40">
                              <td className="px-5 py-4 font-medium text-slate-200">Net Income</td>
                              <td className="px-5 py-4 font-semibold text-white">
                                {formatIDR(fundamentalsRawData.netIncome)}
                              </td>
                            </tr>

                            <tr className="border-b border-slate-700/40">
                              <td className="px-5 py-4 font-medium text-slate-200">
                                Total Assets
                              </td>
                              <td className="px-5 py-4 font-semibold text-white">
                                {formatIDR(fundamentalsRawData.totalAssets)}
                              </td>
                            </tr>

                            <tr className="border-b border-slate-700/40">
                              <td className="px-5 py-4 font-medium text-slate-200">
                                Total Equity
                              </td>
                              <td className="px-5 py-4 font-semibold text-white">
                                {formatIDR(fundamentalsRawData.totalEquity)}
                              </td>
                            </tr>

                            <tr>
                              <td className="px-5 py-4 font-medium text-slate-200">Market Cap</td>
                              <td className="px-5 py-4 font-semibold text-white">
                                {formatIDR(fundamentalsRawData.marketCap)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                <div className="text-center text-sm leading-relaxed text-slate-400">
                  <span className="font-semibold text-slate-300">Catatan interpretasi:</span>{" "}
                  Penilaian ini menggunakan standar umum rasio saham, seperti PER kurang dari 15
                  dianggap murah, PBV kurang dari 1 undervalued, ROE lebih dari 15% dianggap baik,
                  dan EPS positif menunjukkan perusahaan menghasilkan laba. Hasil ini hanya sebagai
                  gambaran awal dan bukan analisis profesional.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}