// ============================================================
// StockDetail.jsx — halaman detail saham (profil + prediksi + fundamental)
// UI POLISH: tab Prediksi & Fundamental dirapi — teks konsisten justify,
//            spacing lebih breathable, hierarki visual lebih jelas
// Bagian penjelasan panjang dibungkus Accordion toggle
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Brain,
  Sparkles,
  CalendarRange,
  ChevronDown,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import StockLogo from "@/components/ui/StockLogo";
import StockCandleChart from "@/components/StockCandleChart";
import { cn } from "@/lib/utils";

// ============================================================
// BAGIAN 0: KOMPONEN ACCORDION
// ============================================================

function Accordion({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border/60 bg-muted/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left",
          "hover:bg-muted/20 transition-colors duration-150",
          open && "border-b border-border/60"
        )}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {icon && <span className="text-base">{icon}</span>}
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="px-4 py-4">{children}</div>}
    </div>
  );
}

// ============================================================
// BAGIAN 1: KAMUS LABEL
// ============================================================

const RATIO_LABELS = {
  eps: "EPS (Laba per Lembar)",
  per: "PER (Harga / Laba)",
  pe: "PER (Harga / Laba)",
  pbv: "PBV (Harga / Nilai Buku)",
  roe: "ROE (Return on Equity)",
};

const RAW_DATA_LABELS = {
  currentPrice: "Harga Saat Ini",
  bookValuePerShare: "Nilai Buku per Saham",
  revenue: "Pendapatan (Revenue)",
  netIncome: "Laba Bersih",
  totalAssets: "Total Aset",
  totalEquity: "Total Ekuitas",
  marketCap: "Kapitalisasi Pasar",
  price_to_book: "PBV (Harga / Nilai Buku)",
  trailing_pe: "PER Trailing",
};

const RAW_DATA_CONTEXT = {
  currentPrice:      "Harga pasar saham saat ini. Dipakai sebagai pembagi dalam PER dan PBV.",
  bookValuePerShare: "Nilai aset bersih per lembar saham. Dasar perhitungan PBV.",
  revenue:           "Total pendapatan sebelum dikurangi biaya. Bukan laba hanya ukuran skala bisnis.",
  netIncome:         "Laba bersih setelah semua biaya. Inilah yang dibagi jadi EPS dan ROE.",
  totalAssets:       "Seluruh aset yang dimiliki perusahaan kas, piutang, properti, dll.",
  totalEquity:       "Modal sendiri (aset dikurangi utang). Dasar perhitungan ROE dan PBV.",
  marketCap:         "Total nilai pasar perusahaan = harga saham × jumlah saham beredar.",
  price_to_book:     "Sama dengan PBV harga saham dibanding nilai buku per saham.",
  trailing_pe:       "PER berbasis laba 12 bulan terakhir (trailing twelve months).",
};

const prettyLabel = (key, dict) => {
  if (!key) return "-";
  const clean = String(key).trim();
  if (dict[clean]) return dict[clean];
  if (dict[clean.toLowerCase()]) return dict[clean.toLowerCase()];
  return clean
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
};

const RATIOS_IN_TOP_CARDS = new Set(["eps", "per", "pe", "pbv", "roe"]);

const TIMEFRAME_OPTIONS = [
  { key: "1D", label: "1D", desc: "1 Hari",   hint: "Menampilkan data harga 1 hari terakhir" },
  { key: "7D", label: "7D", desc: "7 Hari",   hint: "Menampilkan data harga 7 hari terakhir" },
  { key: "1M", label: "1M", desc: "1 Bulan",  hint: "Menampilkan data harga 1 bulan terakhir" },
];

function getTimeframeDescription(timeframe) {
  if (timeframe === "1D") return "1 hari terakhir";
  if (timeframe === "7D") return "7 hari terakhir";
  if (timeframe === "1M") return "1 bulan terakhir";
  return timeframe || "-";
}

// ============================================================
// BAGIAN 2: HELPER FORMAT ANGKA + TANGGAL
// ============================================================

const fmtIDR = (n) =>
  Number.isFinite(Number(n))
    ? `Rp ${Math.round(Number(n)).toLocaleString("id-ID")}`
    : "Rp 0";

const fmtPrice = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return "0";
  return Math.round(num).toLocaleString("id-ID");
};

const fmtPct = (n) =>
  Number.isFinite(Number(n)) ? `${Number(n).toFixed(1)}%` : "0.0%";

function parseDate(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const norm = raw.includes("T") ? raw : raw.replace(" ", "T");
  const dt = new Date(norm);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function fmtVolume(n) {
  const num = Number(n);
  if (!Number.isFinite(num) || num === 0) return "0";
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000)     return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000)         return `${(num / 1_000).toFixed(2)}K`;
  return String(num);
}

function fmtDate(value) {
  const d = parseDate(value);
  if (!d) return value || "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  }).format(d);
}

function fmtDateTime(value) {
  const d = parseDate(value);
  if (!d) return value || "-";
  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(d) + " WIB"
  );
}

function fmtChartUpdate(value, timeframe) {
  if (!value) return "-";
  return timeframe === "1D" ? fmtDateTime(value) : fmtDate(value);
}

function fmtChartIntervalLabel(interval, timeframe) {
  if (timeframe === "1D") return "Per jam";
  if (timeframe === "7D") return "Per hari (7 hari)";
  if (timeframe === "1M") return "Per hari (1 bulan)";
  return interval || "-";
}

// ============================================================
// BAGIAN 3: KOMPONEN UTAMA
// ============================================================

export default function StockDetail() {
  const { ticker = "" } = useParams();

  const [timeframe,    setTimeframe]    = useState("1D");
  const [tab,          setTab]          = useState("deskripsi");
  const [loading,      setLoading]      = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [predicting,   setPredicting]   = useState(false);
  const [loadingFund,  setLoadingFund]  = useState(false);

  const [stockData,    setStockData]    = useState(null);
  const [prediction,   setPrediction]   = useState(null);
  const [fundamentals, setFundamentals] = useState(null);

  useEffect(() => {
    setTab("deskripsi");
    setPrediction(null);
    setFundamentals(null);

    (async () => {
      setLoading(true);
      try {
        const detail = await apiFetch(`/stocks/${ticker}/detail?timeframe=1D`);
        if (detail.ok && detail.data?.success) {
          const next = detail.data.data || {};
          next.chart = next.chart || [];
          next.chartMeta = next.chartMeta || null;
          setStockData(next);
        } else {
          setStockData(null);
        }
      } catch (e) {
        console.error("fetch detail error:", e);
        setStockData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [ticker]);

  useEffect(() => {
    if (!ticker) return;

    (async () => {
      setChartLoading(true);
      try {
        const chart = await apiFetch(
          `/stocks/${ticker}/candlestick?timeframe=${timeframe}`
        );
        setStockData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            chart: chart.ok && chart.data?.success ? chart.data.data || [] : [],
            chartMeta: chart.ok && chart.data?.success
              ? {
                  source:        chart.data.source || "yfinance",
                  latestDate:    chart.data.latestDate || null,
                  latestUpdated: chart.data.latestUpdated || null,
                  interval:      chart.data.interval || "60m",
                }
              : null,
          };
        });
      } catch (e) {
        console.error("fetch chart error:", e);
        setStockData((prev) => prev ? { ...prev, chart: [], chartMeta: null } : prev);
      } finally {
        setChartLoading(false);
      }
    })();
  }, [ticker, timeframe]);

  const handlePredict = async () => {
    if (!ticker) return;
    setPredicting(true);
    try {
      const r = await apiFetch(`/stocks/${ticker}/prediction`);
      setPrediction(r.ok && r.data?.success ? r.data.data : null);
    } finally {
      setPredicting(false);
    }
  };

  const handleFundamentals = async () => {
    if (!ticker) return;
    setLoadingFund(true);
    try {
      const r = await apiFetch(`/stocks/${ticker}/fundamentals`);
      setFundamentals(r.ok && r.data?.success ? r.data.data : null);
    } finally {
      setLoadingFund(false);
    }
  };

  const profile    = stockData?.profile    || {};
  const fundamental = stockData?.fundamental || {};
  const chart      = stockData?.chart      || [];
  const chartMeta  = stockData?.chartMeta  || {};

  const candles = useMemo(
    () => chart.map((c) => ({
      t:      String(c.t),
      open:   Number(c.open),
      high:   Number(c.high),
      low:    Number(c.low),
      close:  Number(c.close),
      volume: Number(c.volume) || 0,
    })),
    [chart]
  );

  const first = candles[0]                        || { open: 0 };
  const last  = candles[candles.length - 1]       || { close: 0 };
  const change = Number(last.close || 0) - Number(first.open || 0);
  const pct    = Number(first.open || 0) === 0
    ? 0
    : (change / Number(first.open || 0)) * 100;
  const isUp   = change >= 0;

  const closeToday     = prediction?.current_price || Number(last.close || 0);
  const closeTodayDate = prediction?.current_price_date || "-";
  const predClose      = prediction?.predicted_close_next_day || closeToday;
  const predDelta      = predClose - closeToday;
  const pricePredPct   = prediction?.price_expected_change_pct ??
    (closeToday === 0 ? 0 : (predDelta / closeToday) * 100);

  const rmse                    = prediction?.rmse || 0;
  const fundamentalPrediction   = prediction?.fundamental_prediction || {};
  const fundamentalReturn3M     = Number(fundamentalPrediction?.estimated_return_pct_3m || 0);
  const fundamentalDirection    = fundamentalPrediction?.direction_3m    || "Netral";
  const recommendation          = fundamentalPrediction?.recommendation  || "HOLD";
  const fundamentalRuleHits     = fundamentalPrediction?.rule_hits        || [];
  const fundamentalScoringMode  = fundamentalPrediction?.scoring_mode     || "";
  const fundamentalSectorBenchmark = fundamentalPrediction?.sector_benchmark || {};
  const fundamentalImpliedPrice = fundamentalPrediction?.implied_fair_price_3m || null;
  const fundamentalRawScore     = fundamentalPrediction?.raw_score ?? null;
  const fundamentalDataAvailability = fundamentalPrediction?.data_availability || null;
  const fundamentalMissingRatios = fundamentalDataAvailability?.missing_ratios || [];
  const fundamentalInputs        = fundamentalPrediction?.fundamental_inputs || {};

  const fundamentalExplanation = useMemo(() => {
    if (!fundamentalPrediction || Object.keys(fundamentalPrediction).length === 0) return "";
    const mode  = fundamentalScoringMode;
    const bm    = fundamentalSectorBenchmark;
    const ret   = fundamentalReturn3M;
    const score = fundamentalRawScore;
    const parts = [];
    if (mode === "relative_sector" && bm?.sector) {
      parts.push(`Skor dihitung relatif terhadap median ${bm.sample_size} saham di sektor "${bm.sector}".`);
    } else if (mode === "absolute_fallback") {
      parts.push("Data benchmark sektor belum cukup skor dihitung menggunakan threshold standar.");
    }
    if (fundamentalDataAvailability) {
      const { available_count, total_count, missing_ratios: mr } = fundamentalDataAvailability;
      if (mr && mr.length > 0) {
        parts.push(`Kelengkapan data: ${available_count}/${total_count} rasio tersedia (${mr.join(", ")} tidak ada — dianggap 0).`);
      } else {
        parts.push(`Kelengkapan data: semua ${total_count} rasio tersedia.`);
      }
    }
    if (score !== null) {
      parts.push(`Raw score: ${score >= 0 ? "+" : ""}${Number(score).toFixed(4)}.`);
    }
    parts.push(`Estimasi return: ${ret >= 0 ? "+" : ""}${ret.toFixed(2)}%.`);
    parts.push(
      recommendation === "BUY"  ? "Rekomendasi BUY karena estimasi return >= 5%."  :
      recommendation === "SELL" ? "Rekomendasi SELL karena estimasi return <= -5%." :
                                  "Rekomendasi HOLD karena estimasi return di antara -5% dan 5%."
    );
    return parts.join(" ");
  }, [fundamentalPrediction, fundamentalScoringMode, fundamentalSectorBenchmark, fundamentalReturn3M, fundamentalRawScore, recommendation, fundamentalDataAvailability]);

  const recommendationPillClass =
    recommendation === "BUY"  ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" :
    recommendation === "HOLD" ? "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300"         :
                                "border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-300";

  const fundamentalsRatios  = fundamentals?.fundamentals?.ratios  || {};
  const fundamentalsRawData = fundamentals?.fundamentals?.rawData || {};

  const extraRatios = useMemo(() => {
    return Object.entries(fundamentalsRatios)
      .filter(([key]) => !RATIOS_IN_TOP_CARDS.has(key.toLowerCase()));
  }, [fundamentalsRatios]);

  const valuation = useMemo(() => {
    const perTTM   = Number(fundamental?.perTTM || 0);
    const pbv      = Number(fundamental?.pbv    || 0);
    const roe      = Number(fundamental?.roe    || 0);
    const perBench = Number(fundamentalSectorBenchmark?.per_median ?? 0);
    const pbvBench = Number(fundamentalSectorBenchmark?.pbv_median ?? 0);
    const roeBench = Number(fundamentalSectorBenchmark?.roe_median ?? 0);

    if (!perBench && !pbvBench && !roeBench) return { label: null, tone: "none" };

    const cheapSignal =
      perBench > 0 && pbvBench > 0 && roeBench > 0 &&
      perTTM <= perBench && pbv <= pbvBench && roe >= roeBench;

    if (cheapSignal) return { label: "Cenderung Murah", tone: "good" };

    if (
      (perBench > 0 && perTTM >= perBench * 1.1) ||
      (pbvBench > 0 && pbv   >= pbvBench * 1.1)
    ) return { label: "Cenderung Mahal", tone: "bad" };

    return { label: "Wajar", tone: "mid" };
  }, [fundamental, fundamentalSectorBenchmark]);

  const valuationClass =
    valuation.tone === "good" ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" :
    valuation.tone === "bad"  ? "border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-300"                 :
    valuation.tone === "none" ? "border-border/50 bg-muted/20 text-muted-foreground"                             :
                                "border-slate-500/30 bg-slate-500/15 text-slate-700 dark:text-slate-300";

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20">
        <Spinner label="Memuat detail saham..." />
      </div>
    );
  }

  if (!stockData) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center text-muted-foreground">
        <p>Data detail saham tidak ditemukan.</p>
        <Link to="/stocks">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </Link>
      </div>
    );
  }

  // ============================================================
  // RENDER UTAMA
  // ============================================================
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">

      <Link
        to="/stocks"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke daftar saham
      </Link>

      {/* HEADER */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <StockLogo ticker={ticker} website={profile.website} logoUrl={profile.logo_url} size="xl" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{ticker}</h1>
                <Badge variant="outline">{profile.sector || "—"}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{profile.shortName || profile.longName || "-"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{profile.industry || "-"}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tracking-tight sm:text-4xl">{fmtIDR(last.close)}</p>
            <div className="mt-1 flex items-center justify-end gap-2">
              {isUp
                ? <TrendingUp   className="h-4 w-4 text-success" />
                : <TrendingDown className="h-4 w-4 text-danger" />}
              <span className={cn("text-sm font-medium", isUp ? "text-success" : "text-danger")}>
                {isUp ? "+" : ""}{fmtIDR(change)} ({fmtPct(pct)})
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-center md:grid-cols-5">
          <InfoBox label="Open"   value={fmtPrice(first.open || 0)} />
          <InfoBox label="High"   value={fmtPrice(candles.length ? Math.max(...candles.map((c) => c.high)) : 0)} />
          <InfoBox label="Low"    value={fmtPrice(candles.length ? Math.min(...candles.map((c) => c.low))  : 0)} />
          <InfoBox label="Close"  value={fmtPrice(last.close || 0)} />
          <InfoBox label="Volume" value={fmtVolume(candles.length ? candles.reduce((s, c) => s + (c.volume || 0), 0) : 0)} />
        </div>
      </Card>

      {/* TOMBOL TIMEFRAME */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Rentang waktu grafik</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Pilih periode untuk mengubah tampilan data harga pada grafik.
              Saat ini menampilkan {getTimeframeDescription(timeframe)}.
            </p>
          </div>
          <div
            className="inline-flex w-full flex-wrap gap-2 rounded-2xl border border-border bg-muted/30 p-1.5 md:w-auto"
            role="tablist"
            aria-label="Pilih rentang waktu grafik"
          >
            {TIMEFRAME_OPTIONS.map((tf) => (
              <button
                key={tf.key}
                type="button"
                onClick={() => setTimeframe(tf.key)}
                title={tf.hint}
                aria-pressed={timeframe === tf.key}
                className={cn(
                  "min-w-[92px] rounded-xl border px-4 py-2.5 text-left transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30",
                  timeframe === tf.key
                    ? "border-primary bg-primary-soft text-primary shadow-soft"
                    : "border-transparent bg-card text-muted-foreground hover:border-primary/20 hover:bg-background hover:text-foreground"
                )}
              >
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold">{tf.label}</span>
                  <span className="mt-0.5 text-[11px] opacity-80">{tf.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* GRAFIK CANDLESTICK */}
      <Card className="p-6">
        <p className="text-xs text-muted-foreground">
          Source: {chartMeta.source || "yfinance"} • Interval:{" "}
          {fmtChartIntervalLabel(chartMeta.interval, timeframe)} • Update terbaru:{" "}
          {fmtChartUpdate(chartMeta.latestUpdated || chartMeta.latestDate, timeframe)}
        </p>
        <p className="mt-1 text-xs text-warning">
          Data ini bukan harga realtime dan grafik hanya visualisasi historis dari yfinance.
        </p>
        <div className="relative mt-4 h-80 md:h-[420px]">
          {chartLoading ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/70 backdrop-blur-[1px]">
              <Spinner label="Memperbarui grafik..." />
            </div>
          ) : candles.length ? (
            <StockCandleChart data={candles} timeframe={timeframe} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              Tidak ada data candlestick OHLC terbaru.
            </div>
          )}
        </div>
      </Card>

      {/* TAB SWITCHER */}
      <div className="flex flex-wrap gap-2">
        {[
          { k: "deskripsi",   label: "Profil",       icon: Building2 },
          { k: "prediksi",    label: "Prediksi AI",  icon: Brain     },
          { k: "fundamental", label: "Fundamental",  icon: Sparkles  },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.k}
              onClick={() => {
                setTab(t.k);
                if (t.k === "prediksi"    && !prediction)   handlePredict();
                if (t.k === "fundamental" && !fundamentals) handleFundamentals();
              }}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-all duration-200",
                "hover:border-primary/50 hover:text-primary",
                tab === t.k
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-card text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* TAB 1: PROFIL PERUSAHAAN                                     */}
      {/* ============================================================ */}
      {tab === "deskripsi" && (
        <Card className="p-6 sm:p-8">
          <h3 className="mb-4 text-lg font-semibold">Profil Perusahaan</h3>
          <dl className="mb-6 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Meta label="Nama"    value={profile.longName || profile.shortName || "-"} />
            <Meta label="Sektor"  value={profile.sector   || "-"} />
            <Meta label="Industri" value={profile.industry || "-"} />
            <Meta label="Lokasi"  value={[profile.city, profile.country].filter(Boolean).join(", ") || "-"} />
          </dl>
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noreferrer"
              className="mb-6 inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              {String(profile.website).replace(/^https?:\/\//, "")}
            </a>
          )}
          <div>
            <p className="mb-2 text-sm font-medium">Tentang perusahaan</p>
            <p className="text-sm leading-relaxed text-justify text-muted-foreground">
              {profile.longBusinessSummary || "Deskripsi perusahaan belum tersedia."}
            </p>
          </div>
        </Card>
      )}

      {/* ============================================================ */}
      {/* TAB 2: PREDIKSI AI                                           */}
      {/* ============================================================ */}
      {tab === "prediksi" && (
        <Card className="p-6 sm:p-8">
          {predicting && !prediction ? (
            <Spinner label="Menjalankan model harga dan analisis fundamental..." />
          ) : !prediction ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary-soft">
                <Brain className="h-7 w-7 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Analisis AI belum dijalankan</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Klik tombol di bawah untuk memulai prediksi harga dan analisis fundamental.
              </p>
              <Button variant="gradient" className="mt-5" onClick={handlePredict} disabled={predicting}>
                {predicting ? "Memprediksi..." : "Mulai Prediksi"}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">

              {/* JUDUL HASIL */}
              <div className="rounded-xl border border-primary/20 bg-primary-soft px-6 py-4 text-center">
                <h2 className="text-base font-bold leading-snug text-foreground md:text-lg">
                  Hasil Prediksi Harga Penutupan Besok{" "}
                  <span className="text-muted-foreground font-normal">(Day Trading)</span>
                  {" "}dan Arah Tren Jangka Menengah{" "}
                  <span className="text-muted-foreground font-normal">(Swing)</span>
                </h2>
              </div>

              {/* HARGA PREDIKSI + AKURASI */}
              <div className="grid gap-4 lg:grid-cols-3">

                {/* Kartu harga prediksi */}
                <Card className="p-5 lg:col-span-2">
                  <h3 className="mb-4 text-base font-semibold text-foreground">
                    Harga Perkiraan Penutupan Besok
                  </h3>
                  <div className="divide-y divide-border/60">
                    <PredRow label="Harga close terakhir (data model)"      value={fmtIDR(closeToday)} />
                    <PredRow label="Tanggal harga close (data model)"       value={closeTodayDate} />
                    <PredRow label="Prediksi penutupan besok"           value={fmtIDR(predClose)} highlight />
                    <PredRow
                      label="Selisih terhadap harga close data model"
                      value={
                        <span className={cn("font-bold tabular-nums", predDelta >= 0 ? "text-success" : "text-danger")}>
                          {predDelta >= 0 ? "+" : ""}{fmtIDR(predDelta)}{" "}
                          <span className="font-normal text-sm">
                            ({pricePredPct >= 0 ? "+" : ""}{Number(pricePredPct).toFixed(2)}%)
                          </span>
                        </span>
                      }
                    />
                  </div>
                </Card>

                {/* Kartu akurasi */}
                <Card className="p-5">
                  <h3 className="mb-4 text-base font-semibold text-foreground">Performa Model</h3>
                  <div className="divide-y divide-border/60">
                    <PredRow
                      label="RMSE"
                      value={<span className="font-semibold tabular-nums">{fmtIDR(rmse)}</span>}
                    />
                    <PredRow label="Waktu Prediksi" value={prediction?.prediction_date || "-"} />
                  </div>

                  {/* Cara membaca RMSE → accordion */}
                  <div className="mt-4">
                    <Accordion title="Cara membaca RMSE" icon="📖">
                      <p className="text-xs leading-relaxed text-justify text-muted-foreground">
                        RMSE (Root Mean Squared Error) menunjukkan seberapa jauh rata-rata prediksi
                        harga model dari harga aktual, dalam satuan Rupiah.
                        Makin kecil nilai RMSE, makin dekat prediksi model terhadap data historis.
                        Contoh: RMSE Rp 150 artinya rata-rata selisih prediksi dan aktual sekitar Rp 150 per saham.
                      </p>
                    </Accordion>
                  </div>
                </Card>
              </div>

              {/* REKOMENDASI FUNDAMENTAL */}
              <Card className="p-5 sm:p-6">
                {/* Header kartu */}
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="text-base font-semibold text-foreground">
                    Rekomendasi Analisis Fundamental
                  </h3>
                  {fundamentalScoringMode && (
                    <span className="inline-flex shrink-0 items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                      {fundamentalScoringMode === "relative_sector"
                        ? `📊 Relatif vs Sektor (n=${fundamentalSectorBenchmark?.sample_size ?? "?"})`
                        : "📋 Threshold Standar"}
                    </span>
                  )}
                </div>

                {/* BANNER RASIO TIDAK TERSEDIA */}
                {fundamentalMissingRatios.length > 0 && (
                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <div className="text-xs leading-relaxed text-foreground">
                      <span className="font-semibold text-amber-700 dark:text-amber-400">
                        Data rasio tidak lengkap:
                      </span>{" "}
                      <span className="font-medium">{fundamentalMissingRatios.join(", ")}</span> tidak tersedia
                      dari sumber data (yfinance) untuk saham ini — kemungkinan karena laporan keuangan
                      terbaru belum tersedia atau saham ini belum melaporkan data tersebut.
                      Rasio yang tidak ada dianggap 0 dalam perhitungan skor, sehingga{" "}
                      <span className="font-medium">hasil analisis ini kurang akurat</span> dibanding
                      saham yang datanya lengkap.
                    </div>
                  </div>
                )}

                {/* 3 METRIK UTAMA */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <MetricCard
                    label="Estimasi Return"
                    value={`${fundamentalReturn3M >= 0 ? "+" : ""}${fundamentalReturn3M.toFixed(2)}%`}
                    tone={fundamentalReturn3M >= 0 ? "success" : "danger"}
                  />
                  <MetricCard
                    label="Arah Tren"
                    value={fundamentalDirection}
                    tone={fundamentalDirection === "Naik" ? "success" : "danger"}
                  />
                  <MetricCard
                    label="Rekomendasi Berdasarkan Skor Fundamental"
                    value={
                      <span className={cn("inline-flex rounded-full border px-3 py-1 text-sm font-semibold", recommendationPillClass)}>
                        {recommendation}
                      </span>
                    }
                  />
                </div>

                {/* BENCHMARK SEKTORAL */}
                {fundamentalScoringMode === "relative_sector" && fundamentalSectorBenchmark?.sector && (
                  <div className="mt-5">
                    <Accordion
                      title={`Benchmark Median Sektor: ${fundamentalSectorBenchmark.sector}`}
                      icon="📊"
                    >
                      <div className="space-y-4">
                        <p className="text-xs text-muted-foreground">
                          Banyak saham di sektor ini:{" "}
                          <span className="font-medium text-foreground">{fundamentalSectorBenchmark.sample_size} saham</span>
                        </p>

                        {/* 4 kotak median */}
                        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                          {[
                            { label: "Median EPS", val: fundamentalSectorBenchmark.eps_median },
                            { label: "Median ROE", val: fundamentalSectorBenchmark.roe_median, pct: true },
                            { label: "Median PBV", val: fundamentalSectorBenchmark.pbv_median },
                            { label: "Median PER", val: fundamentalSectorBenchmark.per_median },
                          ].map(({ label, val, pct }) => (
                            <div key={label} className="rounded-lg border border-border/50 bg-background p-3 text-center">
                              <p className="text-muted-foreground">{label}</p>
                              <p className="mt-1 font-semibold text-foreground tabular-nums">
                                {val != null
                                  ? pct
                                    ? `${Number(val).toFixed(2)}%`
                                    : Number(val).toLocaleString("id-ID", { maximumFractionDigits: 2 })
                                  : "—"}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Interpretasi valuasi */}
                        {valuation.label && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background p-3">
                              <div>
                                <p className="text-xs font-medium text-foreground">Interpretasi Valuasi</p>
                                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                                  Berdasarkan perbandingan PER, PBV, dan ROE terhadap median sektor.
                                </p>
                              </div>
                              <span className={cn("shrink-0 rounded-full border px-3 py-1 text-sm font-semibold", valuationClass)}>
                                {valuation.label}
                              </span>
                            </div>

                            {/* Catatan kenapa EPS tidak masuk valuasi → accordion */}
                            <Accordion title="Kenapa EPS tidak masuk interpretasi valuasi?" icon="💡">
                              <p className="text-[11px] leading-relaxed text-justify text-muted-foreground">
                                EPS adalah angka absolut dalam rupiah sehingga tidak bisa langsung
                                dibandingkan antar saham. EPS bank besar dan EPS startup bisa berbeda
                                ribuan kali lipat tanpa berarti salah satunya lebih "murah". Label valuasi
                                menggunakan PER karena PER sudah memperhitungkan EPS relatif terhadap
                                harga saham, lebih adil untuk perbandingan lintas saham.
                              </p>
                            </Accordion>
                          </div>
                        )}
                      </div>
                    </Accordion>
                  </div>
                )}

                {/* DETAIL SKOR PER RASIO */}
                {fundamentalRuleHits.length > 0 && (
                  <div className="mt-5">
                    <Accordion title="Detail Skor per Rasio" icon="📋">
                      <div className="overflow-x-auto rounded-xl border border-border/60">
                        <table className="w-full min-w-[520px] text-xs">
                          <thead>
                            <tr className="border-b bg-muted/30 text-left text-muted-foreground">
                              <th className="px-3 py-2.5 font-medium">Rasio</th>
                              <th className="px-3 py-2.5 font-medium">Kondisi</th>
                              <th className="px-3 py-2.5 font-medium">Skor</th>
                              {fundamentalRuleHits.some((h) => h.z_score !== undefined && h.z_score !== null) && (
                                <th className="px-3 py-2.5 font-medium">Z-Skor</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {fundamentalRuleHits.map((hit, i) => {
                              const w = Number(hit.weight);
                              const isNoData = w === 0 && String(hit.reason).includes("tidak tersedia");
                              const hasZScore = fundamentalRuleHits.some((h) => h.z_score !== undefined && h.z_score !== null);
                              return (
                                <tr key={i} className={cn(
                                  "border-b border-border/50 last:border-0",
                                  isNoData ? "bg-muted/20" : ""
                                )}>
                                  <td className="px-3 py-2.5 font-semibold">{hit.feature}</td>
                                  <td className={cn("px-3 py-2.5", isNoData ? "text-muted-foreground italic" : "text-muted-foreground")}>
                                    {hit.reason}
                                  </td>
                                  <td className={cn(
                                    "px-3 py-2.5 font-semibold tabular-nums",
                                    isNoData
                                      ? "text-muted-foreground"
                                      : w >= 0 ? "text-success" : "text-danger"
                                  )}>
                                    {isNoData ? "—" : `${w >= 0 ? "+" : ""}${w.toFixed(3)}`}
                                  </td>
                                  {hasZScore && (
                                    <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                                      {hit.z_score != null ? Number(hit.z_score).toFixed(2) : "—"}
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="border-t bg-muted/20">
                              <td className="px-3 py-2.5 font-semibold" colSpan={2}>Raw Score Total</td>
                              <td className={cn(
                                "px-3 py-2.5 font-bold tabular-nums",
                                (fundamentalRawScore ?? 0) >= 0 ? "text-success" : "text-danger"
                              )}>
                                {fundamentalRawScore != null
                                  ? `${Number(fundamentalRawScore) >= 0 ? "+" : ""}${Number(fundamentalRawScore).toFixed(4)}`
                                  : "—"}
                              </td>
                              {fundamentalRuleHits.some((h) => h.z_score !== undefined && h.z_score !== null) && <td />}
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </Accordion>
                  </div>
                )}

                {/* PENJELASAN METODOLOGI → accordion */}
                {fundamentalExplanation && (
                  <div className="mt-4">
                    <Accordion title="Metodologi Perhitungan" icon="🔬">
                      <p className="text-[11px] leading-relaxed text-justify text-muted-foreground">
                        {fundamentalExplanation}{" "}
                        Sistem ini menilai saham menggunakan empat rasio utama: EPS, PER, PBV, dan ROE.
                        Setiap rasio dibandingkan dengan median sektor, hasilnya diukur menggunakan Z-Score,
                        yaitu seberapa jauh nilai saham ini dari rata-rata perusahaan lain di sektor yang sama.
                        Dari Z-Score tersebut, setiap rasio mendapat skor: positif kalau kondisinya lebih baik
                        dari rata-rata sektor, negatif kalau di bawahnya.
                        Semua skor dijumlahkan menjadi Raw Score Total, lalu dikonversi menjadi estimasi return
                        dalam persen untuk jangka menengah.
                        Jika estimasi return ≥ 5% maka rekomendasinya <strong className="text-emerald-700 dark:text-emerald-400">BUY</strong>,{" "}
                        ≤ −5% maka <strong className="text-red-700 dark:text-red-400">SELL</strong>,
                        dan di antaranya <strong className="text-amber-700 dark:text-amber-400">HOLD</strong>.
                      </p>
                    </Accordion>
                  </div>
                )}
              </Card>

              {/* DISCLAIMER */}
              <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <p className="text-xs leading-relaxed text-justify text-foreground">
                  <span className="font-medium">Disclaimer:</span> Hasil prediksi ini bukan
                  merupakan kepastian dan bukan merupakan ajakan untuk membeli atau menjual saham.
                  Selalu lakukan riset mandiri sebelum mengambil keputusan investasi.
                </p>
              </div>

            </div>
          )}
        </Card>
      )}

      {/* ============================================================ */}
      {/* TAB 3: FUNDAMENTAL                                           */}
      {/* ============================================================ */}
      {tab === "fundamental" && (
        <Card className="p-6 sm:p-8">
          {!fundamentals && !loadingFund && (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary-soft">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Data fundamental belum dimuat</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Klik tombol di bawah untuk mengambil data laporan keuangan saham ini.
              </p>
              <Button variant="primary" className="mt-5" onClick={handleFundamentals}>
                Muat Data Fundamental
              </Button>
            </div>
          )}

          {loadingFund && <Spinner label="Memuat data fundamental..." />}

          {fundamentals && (
            <div className="space-y-6">

              {/* 4 KARTU RASIO EDUKATIF */}
              <div>
                <h3 className="mb-3 text-base font-semibold text-foreground">Rasio Utama</h3>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <RatioCard
                    label="EPS"
                    fullName="Earning Per Share"
                    value={formatFundValue(fundamentalsRatios.eps ?? fundamental?.eps)}
                    description="Laba bersih yang dihasilkan per lembar saham. Nilai positif artinya perusahaan untung. Makin tinggi makin baik."
                    hint="Dihitung dari Net Income ÷ jumlah saham beredar. Ini adalah angka laba paling dasar dari sebuah saham."
                    good={(fundamentalsRatios.eps ?? fundamental?.eps) > 0}
                  />
                  <RatioCard
                    label="PER"
                    fullName="Price to Earnings Ratio"
                    value={formatFundValue(
                      fundamentalsRatios.per ?? fundamentalsRatios.pe ?? fundamental?.perTTM
                    )}
                    description="Berapa kali investor bersedia membayar dibanding laba perusahaan. PER rendah bisa berarti murah, PER tinggi bisa berarti premium atau diekspektasi tumbuh pesat."
                    hint="Dihitung dari Harga Saham ÷ EPS. PER < 15× umumnya dianggap value, 15–25× wajar, > 25× premium."
                    good={(() => {
                      const v = Number(
                        fundamentalsRatios.per ??
                        fundamentalsRatios.pe ??
                        fundamental?.perTTM
                      );
                      return v > 0 && v <= 25;
                    })()}
                  />
                  <RatioCard
                    label="PBV"
                    fullName="Price to Book Value"
                    value={formatFundValue(fundamentalsRatios.pbv ?? fundamental?.pbv)}
                    description="Perbandingan harga saham terhadap nilai buku aset perusahaan. PBV di bawah 1× bisa berarti saham undervalued harga lebih murah dari nilai aset bersihnya."
                    hint="Dihitung dari Harga Saham ÷ Nilai Buku per Saham (Total Ekuitas ÷ jumlah saham). Wajar untuk growth stock di kisaran 1–3×."
                    good={(() => {
                      const v = Number(fundamentalsRatios.pbv ?? fundamental?.pbv);
                      return v > 0 && v <= 3;
                    })()}
                  />
                  <RatioCard
                    label="ROE"
                    fullName="Return on Equity"
                    value={formatFundValue(
                      fundamentalsRatios.roe ??
                      fundamentals?.fundamentals?.ratios?.roe ??
                      fundamental?.roe,
                      true
                    )}
                    description="Seberapa efisien perusahaan menghasilkan laba dari modal sendiri. Makin tinggi artinya manajemen makin produktif memutar uang pemegang saham."
                    hint="Dihitung dari Net Income ÷ Total Ekuitas. ROE ≥ 15% dianggap sehat dan kompetitif di pasar Indonesia."
                    good={Number(
                      fundamentalsRatios.roe ??
                      fundamentals?.fundamentals?.ratios?.roe ??
                      fundamental?.roe
                    ) >= 15}
                  />
                </div>
              </div>

              {/* KENAPA 4 RASIO INI → accordion */}
              <Accordion title="Kenapa fokus ke EPS, PER, PBV, dan ROE?" icon="🧠">
                <div className="space-y-4">
                  <p className="text-xs leading-relaxed text-justify text-muted-foreground">
                    Empat rasio ini dipilih sebagai fondasi utama karena paling stabil untuk membaca
                    laba, valuasi, dan efisiensi di banyak saham BEI. Bukan karena rasio lain tidak
                    penting DER, ROA, NPM pun sering dipakai. Namun dari banyak studi dan
                    konsistensi lintas sektor di BEI, EPS, PER, PBV, dan ROE cenderung paling sering
                    menunjukkan pengaruh signifikan terhadap harga maupun return. Rasio lain kadang
                    sangat bergantung pada sektor tertentu (misalnya perbankan vs manufaktur),
                    sehingga menambah kompleksitas tanpa selalu meningkatkan akurasi keputusan.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      {
                        rasio: "EPS",
                        alasan: "Sinyal paling langsung apakah perusahaan benar-benar menghasilkan laba untuk pemegang saham.",
                      },
                      {
                        rasio: "PER",
                        alasan: "Mengukur apakah pasar menghargai laba perusahaan terlalu mahal, wajar, atau murah.",
                      },
                      {
                        rasio: "PBV",
                        alasan: "Membandingkan harga pasar dengan nilai buku aset berguna membaca apakah saham undervalued atau overvalued.",
                      },
                      {
                        rasio: "ROE",
                        alasan: "Menilai efisiensi manajemen mengelola modal sendiri historis kuat untuk kualitas bisnis jangka menengah.",
                      },
                    ].map(({ rasio, alasan }) => (
                      <div key={rasio} className="rounded-lg border border-border/50 bg-muted/10 p-3">
                        <p className="mb-1 text-xs font-semibold text-foreground">{rasio}</p>
                        <p className="text-[11px] leading-relaxed text-justify text-muted-foreground">{alasan}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border border-border/40 bg-muted/20 px-3.5 py-3">
                    <p className="text-[11px] leading-relaxed text-justify text-muted-foreground">
                      💡 <span className="font-medium text-foreground">Intinya:</span>{" "}
                      Dashboard ini memprioritaskan rasio yang paling informatif, konsisten, dan
                      mudah dibandingkan lintas saham Indonesia supaya analisis lebih sederhana
                      tanpa kehilangan inti kualitas bisnis.
                    </p>
                  </div>
                </div>
              </Accordion>

              {/* CATATAN HUBUNGAN RASIO → RAW DATA → accordion */}
              <Accordion title="Dari mana angka-angka ini berasal?" icon="🔗">
                <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">EPS</span> dihitung dari{" "}
                    <span className="font-medium text-foreground">Laba Bersih (Net Income)</span>{" "}
                    dibagi jumlah saham beredar.
                  </p>
                  <p>
                    <span className="font-medium text-foreground">PER</span> dihitung dari
                    harga saham saat ini dibagi EPS jadi EPS adalah bahan baku PER.
                  </p>
                  <p>
                    <span className="font-medium text-foreground">PBV</span> dihitung dari
                    harga saham dibagi{" "}
                    <span className="font-medium text-foreground">Nilai Buku per Saham</span>,
                    yang berasal dari{" "}
                    <span className="font-medium text-foreground">Total Ekuitas</span>.
                  </p>
                  <p>
                    <span className="font-medium text-foreground">ROE</span> dihitung dari{" "}
                    <span className="font-medium text-foreground">Net Income</span> dibagi{" "}
                    <span className="font-medium text-foreground">Total Ekuitas</span>.
                  </p>
                  <p className="pt-2 mt-1 border-t border-border/40">
                    Angka mentah lengkap (Revenue, Net Income, Total Aset, dll)
                    tersedia di tabel Data Mentah di bawah.
                  </p>
                </div>
              </Accordion>

              {/* TABEL DATA MENTAH */}
              <Card className="p-5 sm:p-6">
                <h3 className="mb-1 text-base font-semibold text-foreground">Data Mentah</h3>
                <p className="mb-4 text-xs text-muted-foreground">
                  Angka-angka laporan keuangan yang menjadi dasar perhitungan rasio di atas.
                </p>
                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30 text-left text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Keterangan</th>
                        <th className="px-4 py-3 font-medium text-right">Nilai</th>
                        <th className="px-4 py-3 text-xs font-medium">Kaitannya dengan rasio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(fundamentalsRawData).length ? (
                        Object.entries(fundamentalsRawData).map(([k, v]) => (
                          <tr key={k} className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors">
                            <td className="px-4 py-3 font-medium">{prettyLabel(k, RAW_DATA_LABELS)}</td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums">{formatRawValue(k, v)}</td>
                            <td className="px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                              {RAW_DATA_CONTEXT[k] || "—"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <>
                          <RawRow labelKey="currentPrice"      value={fundamental?.currentPrice} />
                          <RawRow labelKey="bookValuePerShare"  value={fundamental?.bookValuePerShare} />
                          <RawRow labelKey="revenue"            value={fundamental?.revenue} />
                          <RawRow labelKey="netIncome"          value={fundamental?.netIncome} />
                          <RawRow labelKey="totalAssets"        value={fundamental?.totalAssets} />
                          <RawRow labelKey="totalEquity"        value={fundamental?.totalEquity} />
                          <RawRow labelKey="marketCap"          value={fundamental?.marketCap} />
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ============================================================
// BAGIAN 4: SUB-KOMPONEN
// ============================================================

function Meta({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

// Baris prediksi — dipakai di tab Prediksi
function PredRow({ label, value, highlight }) {
  return (
    <div className={cn(
      "flex items-start justify-between gap-4 py-3",
      highlight && "rounded-lg bg-primary-soft/40 px-3 -mx-3"
    )}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-right text-sm font-medium", highlight && "font-semibold text-foreground")}>
        {value}
      </span>
    </div>
  );
}

// Kartu metrik ringkas — dipakai di grid 4 metrik prediksi
function MetricCard({ label, sublabel, value, tone }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {sublabel && <p className="mt-0.5 text-[10px] text-muted-foreground/60">{sublabel}</p>}
      <div className={cn(
        "mt-2 text-lg font-bold leading-tight",
        tone === "success" && "text-success",
        tone === "danger"  && "text-danger",
        !tone              && "text-foreground"
      )}>
        {value}
      </div>
    </Card>
  );
}

// Kartu rasio EDUKATIF — dipakai di tab Fundamental
function RatioCard({ label, fullName, value, description, hint, good }) {
  const isGood = good === true;
  const isBad  = good === false;

  return (
    <Card className="flex flex-col gap-3 p-4">
      {/* header: nama + indikator */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          <p className="text-[10px] text-muted-foreground/60">{fullName}</p>
        </div>
        <span className={cn(
          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
          isGood
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : isBad
            ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
            : "border-border/50 bg-muted/20 text-muted-foreground"
        )}>
          {isGood ? "✓ Baik" : isBad ? "✗ Perhatikan" : "—"}
        </span>
      </div>

      {/* nilai utama */}
      <p className={cn(
        "text-2xl font-bold tabular-nums",
        isGood ? "text-success" : isBad ? "text-danger" : "text-foreground"
      )}>
        {value}
      </p>

      {/* penjelasan + cara hitung → accordion */}
      <Accordion title="Penjelasan & Cara Hitung">
        <div className="space-y-2">
          <p className="text-[11px] leading-relaxed text-justify text-muted-foreground">
            {description}
          </p>
          <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
            <p className="text-[10px] leading-relaxed text-muted-foreground">💡 {hint}</p>
          </div>
        </div>
      </Accordion>
    </Card>
  );
}

function InfoBox({ label, value }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

// Baris fallback untuk raw data kalau backend tidak kirim rawData
function RawRow({ labelKey, value }) {
  return (
    <tr className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors">
      <td className="px-4 py-3 font-medium">{prettyLabel(labelKey, RAW_DATA_LABELS)}</td>
      <td className="px-4 py-3 text-right font-mono tabular-nums">{formatRawValue(labelKey, value)}</td>
      <td className="px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        {RAW_DATA_CONTEXT[labelKey] || "—"}
      </td>
    </tr>
  );
}

function formatFundValue(value, isPercent = false) {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  if (isPercent) return `${num.toFixed(2)}%`;
  return num.toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

function formatRawValue(key, value) {
  if (value === null || value === undefined || value === "") return "—";
  const lowerKey = String(key || "").toLowerCase();
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  if (
    lowerKey.includes("price")     ||
    lowerKey.includes("cap")       ||
    lowerKey.includes("revenue")   ||
    lowerKey.includes("income")    ||
    lowerKey.includes("assets")    ||
    lowerKey.includes("equity")    ||
    lowerKey.includes("bookvalue")
  ) {
    return `Rp ${Math.round(num).toLocaleString("id-ID")}`;
  }
  return num.toLocaleString("id-ID", { maximumFractionDigits: 2 });
}