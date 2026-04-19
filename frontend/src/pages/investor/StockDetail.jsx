// ============================================================
// StockDetail.jsx — halaman detail saham (profil + prediksi + fundamental)
// FIX: duplikasi rasio, warna interpretasi light-mode, label raw data rapi
// UX: tombol timeframe dibuat lebih jelas dan informatif
// PERF: ganti timeframe hanya me-refresh card grafik, bukan seluruh halaman
// ============================================================

import { useEffect, useMemo, useState } from "react"; // ambil hook React buat state + efek + memo
import { useParams, Link } from "react-router-dom"; // ambil param URL + komponen link
import {
  AlertTriangle, // ikon peringatan
  ArrowLeft, // ikon panah balik
  Building2, // ikon gedung buat tab profil
  ExternalLink, // ikon link luar
  TrendingUp, // panah naik
  TrendingDown, // panah turun
  Brain, // ikon AI
  Sparkles, // ikon "keren" buat tab fundamental
  CalendarRange, // ikon timeframe
} from "lucide-react"; // icon pack
import { apiFetch } from "@/lib/api"; // wrapper fetch ke backend
import { Card } from "@/components/ui/Card"; // komponen kartu
import Button from "@/components/ui/Button"; // tombol custom
import Badge from "@/components/ui/Badge"; // badge label
import Spinner from "@/components/ui/Spinner"; // loader muter
import StockLogo from "@/components/ui/StockLogo"; // logo saham otomatis
import StockCandleChart from "@/components/StockCandleChart"; // grafik candle
import { cn } from "@/lib/utils"; // helper gabung className

// ============================================================
// BAGIAN 1: KAMUS LABEL — biar key mentah dari API jadi nama manusiawi
// ============================================================

// dict rasio — key dari backend -> label yang enak dibaca
const RATIO_LABELS = {
  eps: "EPS (Laba per Lembar)", // Earning per Share
  per: "PER (Harga / Laba)", // Price to Earning Ratio
  pe: "PER (Harga / Laba)", // alias dari backend kadang pakai "pe"
  pbv: "PBV (Harga / Nilai Buku)", // Price to Book Value
  roe: "ROE (Return on Equity)", // profitabilitas terhadap ekuitas
};

// dict raw data — nama variabel koding -> istilah keuangan bahasa Indonesia
const RAW_DATA_LABELS = {
  currentPrice: "Harga Saat Ini", // harga pasar terakhir
  bookValuePerShare: "Nilai Buku per Saham", // book value
  revenue: "Pendapatan (Revenue)", // total penjualan
  netIncome: "Laba Bersih", // net income
  totalAssets: "Total Aset", // total assets
  totalEquity: "Total Ekuitas", // total equity
  marketCap: "Kapitalisasi Pasar", // market cap
  price_to_book: "PBV (Harga / Nilai Buku)", // jaga-jaga kalau ada varian snake_case
  trailing_pe: "PER Trailing", // PE trailing 12 bulan
};

// helper ambil label ramah manusia dari key mentah
const prettyLabel = (key, dict) => {
  if (!key) return "-"; // jaga-jaga null
  const clean = String(key).trim(); // rapihin spasi
  if (dict[clean]) return dict[clean]; // ketemu di dict -> pake
  if (dict[clean.toLowerCase()]) return dict[clean.toLowerCase()]; // fallback lowercase
  return clean // belum ada di dict -> ubah camelCase jadi spasi
    .replace(/([A-Z])/g, " $1") // sisip spasi sebelum huruf kapital
    .replace(/_/g, " ") // snake_case jadi spasi
    .replace(/\b\w/g, (c) => c.toUpperCase()) // title case tiap kata
    .trim(); // trim akhir
};

// set key rasio yang SUDAH muncul di kartu atas — biar nggak dobel di tabel bawah
const RATIOS_IN_TOP_CARDS = new Set(["eps", "per", "pe", "pbv", "roe"]);

// opsi timeframe — biar label lebih jelas buat user
const TIMEFRAME_OPTIONS = [
  {
    key: "1D",
    label: "1D",
    desc: "1 Hari",
    hint: "Menampilkan data harga 1 hari terakhir",
  },
  {
    key: "7D",
    label: "7D",
    desc: "7 Hari",
    hint: "Menampilkan data harga 7 hari terakhir",
  },
  {
    key: "1M",
    label: "1M",
    desc: "1 Bulan",
    hint: "Menampilkan data harga 1 bulan terakhir",
  },
];

// helper label human-readable untuk timeframe aktif
function getTimeframeDescription(timeframe) {
  if (timeframe === "1D") return "1 hari terakhir";
  if (timeframe === "7D") return "7 hari terakhir";
  if (timeframe === "1M") return "1 bulan terakhir";
  return timeframe || "-";
}

// ============================================================
// BAGIAN 2: HELPER FORMAT ANGKA + TANGGAL
// ============================================================

// format ke Rupiah, fallback 0 kalau bukan angka
const fmtIDR = (n) =>
  Number.isFinite(Number(n))
    ? `Rp ${Math.round(Number(n)).toLocaleString("id-ID")}`
    : "Rp 0";

// format angka harga tanpa prefix Rp (buat OHLC / chart summary)
const fmtPrice = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return "0";

  // paksa bulat seperti fmtIDR
  const rounded = Math.round(num);

  return rounded.toLocaleString("id-ID");
};

// format persen 1 angka di belakang koma
const fmtPct = (n) =>
  Number.isFinite(Number(n)) ? `${Number(n).toFixed(1)}%` : "0.0%";

// parse string tanggal ke Date (toleran format)
function parseDate(value) {
  if (!value) return null; // kosong -> null

  const raw = String(value).trim(); // normalisasi jadi string + trim

  // format "YYYY-MM-DD" murni -> rakit manual biar timezone aman
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split("-").map(Number); // pecah jadi angka
    return new Date(y, m - 1, d); // bulan 0-based
  }

  // format ada waktu -> pastiin pake "T"
  const norm = raw.includes("T") ? raw : raw.replace(" ", "T");
  const dt = new Date(norm); // konstruksi Date
  return Number.isNaN(dt.getTime()) ? null : dt; // invalid -> null
}

// format tanggal doang
function fmtDate(value) {
  const d = parseDate(value); // parse dulu
  if (!d) return value || "-"; // gagal -> raw atau dash

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit", // tanggal 2 digit
    month: "short", // bulan singkat (Jan, Feb...)
    year: "numeric", // tahun 4 digit
  }).format(d);
}

// format tanggal + jam
function fmtDateTime(value) {
  const d = parseDate(value); // parse
  if (!d) return value || "-"; // gagal -> raw

  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "2-digit", // tgl
      month: "short", // bulan
      year: "numeric", // thn
      hour: "2-digit", // jam
      minute: "2-digit", // menit
    }).format(d) + " WIB" // append zona waktu
  );
}

// pilih format berdasar timeframe (1D butuh jam, lainnya cukup tgl)
function fmtChartUpdate(value, timeframe) {
  if (!value) return "-"; // kosong
  return timeframe === "1D" ? fmtDateTime(value) : fmtDate(value);
}

// label interval grafik
function fmtChartIntervalLabel(interval, timeframe) {
  if (timeframe === "1D") return "Per jam"; // 1 hari -> per jam
  if (timeframe === "7D") return "Per hari (7 hari)"; // seminggu
  if (timeframe === "1M") return "Per hari (1 bulan)"; // sebulan
  return interval || "-"; // fallback
}

// ============================================================
// BAGIAN 3: KOMPONEN UTAMA
// ============================================================

export default function StockDetail() {
  const { ticker = "" } = useParams(); // ambil ticker dari URL (contoh: /stocks/BBCA)

  // --- state lokal ---
  const [timeframe, setTimeframe] = useState("1D"); // pilihan rentang grafik
  const [tab, setTab] = useState("deskripsi"); // tab aktif
  const [loading, setLoading] = useState(true); // loading halaman awal
  const [chartLoading, setChartLoading] = useState(false); // loading khusus chart
  const [predicting, setPredicting] = useState(false); // loading prediksi
  const [loadingFund, setLoadingFund] = useState(false); // loading fundamental

  const [stockData, setStockData] = useState(null); // bundle detail saham
  const [prediction, setPrediction] = useState(null); // hasil prediksi ML
  const [fundamentals, setFundamentals] = useState(null); // data fundamental detail

  // fetch detail utama — hanya saat ticker berubah
  useEffect(() => {
    setTab("deskripsi"); // reset tab hanya saat pindah ticker
    setPrediction(null); // opsional reset data per ticker
    setFundamentals(null); // opsional reset data per ticker

    (async () => {
      setLoading(true); // mulai loading halaman awal
      try {
        const detail = await apiFetch(`/stocks/${ticker}/detail?timeframe=1D`);

        if (detail.ok && detail.data?.success) {
          const next = detail.data.data || {};
          next.chart = next.chart || [];
          next.chartMeta = next.chartMeta || null;
          setStockData(next); // simpan base detail
        } else {
          setStockData(null); // gagal -> kosongin
        }
      } catch (e) {
        console.error("fetch detail error:", e); // log buat debug
        setStockData(null); // error -> kosong
      } finally {
        setLoading(false); // selesai loading awal
      }
    })();
  }, [ticker]);

  // fetch chart saja — saat ticker atau timeframe berubah
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
            chart:
              chart.ok && chart.data?.success
                ? chart.data.data || []
                : [],
            chartMeta:
              chart.ok && chart.data?.success
                ? {
                    source: chart.data.source || "yfinance",
                    latestDate: chart.data.latestDate || null,
                    latestUpdated: chart.data.latestUpdated || null,
                    interval: chart.data.interval || "60m",
                  }
                : null,
          };
        });
      } catch (e) {
        console.error("fetch chart error:", e);
        setStockData((prev) =>
          prev
            ? {
                ...prev,
                chart: [],
                chartMeta: null,
              }
            : prev
        );
      } finally {
        setChartLoading(false);
      }
    })();
  }, [ticker, timeframe]);

  // handler tombol prediksi AI
  const handlePredict = async () => {
    if (!ticker) return; // guard kalau ticker kosong
    setPredicting(true); // spinner tombol nyala

    try {
      const r = await apiFetch(`/stocks/${ticker}/prediction`); // hit endpoint ML
      setPrediction(r.ok && r.data?.success ? r.data.data : null); // simpan hasil
    } finally {
      setPredicting(false); // spinner tombol mati
    }
  };

  // handler tombol load fundamental
  const handleFundamentals = async () => {
    if (!ticker) return; // guard
    setLoadingFund(true); // spinner on

    try {
      const r = await apiFetch(`/stocks/${ticker}/fundamentals`); // hit endpoint
      setFundamentals(r.ok && r.data?.success ? r.data.data : null); // simpan
    } finally {
      setLoadingFund(false); // spinner off
    }
  };

  // --- destructure data buat shortcut ---
  const profile = stockData?.profile || {}; // profil perusahaan
  const fundamental = stockData?.fundamental || {}; // fundamental ringkas (dari detail)
  const chart = stockData?.chart || []; // array candle
  const chartMeta = stockData?.chartMeta || {}; // metadata chart

  // konversi data chart ke tipe number (jaga-jaga backend kirim string)
  const candles = useMemo(
    () =>
      chart.map((c) => ({
        t: String(c.t), // label waktu
        open: Number(c.open), // harga open
        high: Number(c.high), // harga tertinggi
        low: Number(c.low), // harga terendah
        close: Number(c.close), // harga close
      })),
    [chart] // recompute kalau chart berubah
  );

  const first = candles[0] || { open: 0 }; // candle pertama (acuan awal)
  const last = candles[candles.length - 1] || { close: 0 }; // candle terakhir

  // selisih harga periode ini
  const change = Number(last.close || 0) - Number(first.open || 0);
  // persentase perubahan (hindari bagi nol)
  const pct =
    Number(first.open || 0) === 0
      ? 0
      : (change / Number(first.open || 0)) * 100;
  const isUp = change >= 0; // naik apa turun

  // --- data prediksi AI ---
  const closeToday = prediction?.current_price || Number(last.close || 0); // harga sekarang
  const closeTodayDate = prediction?.current_price_date || "-"; // tgl harga sekarang
  const predClose = prediction?.predicted_close_next_day || closeToday; // prediksi besok
  const predDelta = predClose - closeToday; // selisih prediksi

  // persentase perubahan prediksi (fallback hitung manual)
  const pricePredPct =
    prediction?.price_expected_change_pct ??
    (closeToday === 0 ? 0 : (predDelta / closeToday) * 100);

  const mape = prediction?.mape || 0; // error rata-rata model
  const fundamentalPrediction = prediction?.fundamental_prediction || {}; // hasil skor fundamental
  const fundamentalReturn3M = Number(
    fundamentalPrediction?.estimated_return_pct_3m || 0 // estimasi return 3 bulan
  );
  const fundamentalDirection = fundamentalPrediction?.direction_3m || "Netral"; // arah naik/turun
  const recommendation = fundamentalPrediction?.recommendation || "HOLD"; // BUY/HOLD/SELL

  // varian badge sesuai rekomendasi
  const recVariant =
    recommendation === "BUY"
      ? "success" // hijau
      : recommendation === "HOLD"
      ? "warning" // kuning
      : "danger"; // merah

  // FIX: class pill rekomendasi — pake dark: variant biar kontras di light mode
  const recommendationPillClass =
    recommendation === "BUY"
      ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : recommendation === "HOLD"
      ? "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300"
      : "border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-300";

  // data rasio + raw dari response fundamentals
  const fundamentalsRatios = fundamentals?.fundamentals?.ratios || {};
  const fundamentalsRawData = fundamentals?.fundamentals?.rawData || {};
  const benchmarks = fundamental?.benchmarks || {}; // nilai acuan industri

  // FIX: filter rasio yang SUDAH ditampilin di kartu atas biar tabel bawah nggak dobel
  const extraRatios = useMemo(() => {
    const entries = Object.entries(fundamentalsRatios); // ubah objek -> array pair
    return entries.filter(([key]) => !RATIOS_IN_TOP_CARDS.has(key.toLowerCase())); // skip key yg sudah dipake
  }, [fundamentalsRatios]);

  // hitung kesimpulan valuasi (Murah / Wajar / Mahal)
  const valuation = useMemo(() => {
    const perTTM = Number(fundamental?.perTTM || 0); // PER aktual
    const pbv = Number(fundamental?.pbv || 0); // PBV aktual
    const roe = Number(fundamental?.roe || 0); // ROE aktual

    const perBench = Number(benchmarks?.per || 0); // benchmark PER industri
    const pbvBench = Number(benchmarks?.pbv || 0); // benchmark PBV
    const roeBench = Number(benchmarks?.roe || 0); // benchmark ROE

    // sinyal murah: PER & PBV di bawah benchmark + ROE di atas benchmark
    const cheapSignal =
      perBench > 0 &&
      pbvBench > 0 &&
      roeBench > 0 &&
      perTTM <= perBench &&
      pbv <= pbvBench &&
      roe >= roeBench;

    if (cheapSignal) return { label: "Cenderung Murah", tone: "good" };

    // sinyal mahal: PER atau PBV 10% lebih tinggi dari benchmark
    if (
      perBench > 0 &&
      pbvBench > 0 &&
      (perTTM >= perBench * 1.1 || pbv >= pbvBench * 1.1)
    ) {
      return { label: "Cenderung Mahal", tone: "bad" };
    }

    return { label: "Wajar", tone: "mid" }; // default
  }, [fundamental, benchmarks]); // recompute kalau data berubah

  // FIX: warna pill valuasi — tambah dark: variant biar teks jelas di light mode
  const valuationClass =
    valuation.tone === "good"
      ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : valuation.tone === "bad"
      ? "border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-300"
      : "border-slate-500/30 bg-slate-500/15 text-slate-700 dark:text-slate-300";

  // --- render kondisional: loading ---
  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20">
        <Spinner label="Memuat detail saham..." />
      </div>
    );
  }

  // --- render kondisional: data nggak ketemu ---
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

  // --- render utama halaman ---
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* link balik ke list saham */}
      <Link
        to="/stocks"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke daftar saham
      </Link>

      {/* HEADER — logo + nama + harga */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            {/* logo otomatis (lihat StockLogo.jsx) */}
            <StockLogo
              ticker={ticker}
              website={profile.website}
              logoUrl={profile.logo_url}
              size="xl"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {ticker}
                </h1>
                <Badge variant="outline">{profile.sector || "—"}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {profile.shortName || profile.longName || "-"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {profile.industry || "-"}
              </p>
            </div>
          </div>

          {/* harga terakhir + perubahan */}
          <div className="text-right">
            <p className="text-3xl font-bold tracking-tight sm:text-4xl">
              {fmtIDR(last.close)}
            </p>
            <div className="mt-1 flex items-center justify-end gap-2">
              {isUp ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-danger" />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  isUp ? "text-success" : "text-danger"
                )}
              >
                {isUp ? "+" : ""}
                {fmtIDR(change)} ({fmtPct(pct)})
              </span>
            </div>
          </div>
        </div>

        {/* OHLC ringkas */}
        <div className="mt-6 grid grid-cols-2 gap-4 text-center md:grid-cols-5">
          <InfoBox label="Open" value={fmtPrice(first.open || 0)} />
          <InfoBox
            label="High"
            value={fmtPrice(
              candles.length ? Math.max(...candles.map((c) => c.high)) : 0
            )}
          />
          <InfoBox
            label="Low"
            value={fmtPrice(
              candles.length ? Math.min(...candles.map((c) => c.low)) : 0
            )}
          />
          <InfoBox label="Close" value={fmtPrice(last.close || 0)} />
          <div>
          <p className="text-xs text-muted-foreground">Perubahan</p>
          <p
            className={cn(
              "mt-1 text-lg font-bold",
              change >= 0 ? "text-success" : "text-danger"
            )}
          >
            {change >= 0 ? "+" : "-"}
            {fmtPrice(Math.abs(change))} ({fmtPct(pct)})
          </p>
        </div>
        </div>
      </Card>

      {/* TOMBOL RENTANG WAKTU */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">
                Rentang waktu grafik
              </p>
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
                  <span className="mt-0.5 text-[11px] opacity-80">
                    {tf.desc}
                  </span>
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
          {fmtChartIntervalLabel(chartMeta.interval, timeframe)} • Update
          terbaru:{" "}
          {fmtChartUpdate(
            chartMeta.latestUpdated || chartMeta.latestDate,
            timeframe
          )}
        </p>
        <p className="mt-1 text-xs text-warning">
          Data ini bukan harga realtime dan grafik hanya visualisasi historis
          dari yfinance.
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
          { k: "deskripsi", label: "Profil", icon: Building2 },
          { k: "prediksi", label: "Prediksi AI", icon: Brain },
          { k: "fundamental", label: "Fundamental", icon: Sparkles },
        ].map((t) => {
          const Icon = t.icon; // komponen ikon
          return (
            <button
              key={t.k}
              onClick={() => {
                setTab(t.k); // ganti tab
                // lazy-load data hanya saat tab pertama kali dibuka
                if (t.k === "prediksi" && !prediction) handlePredict();
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

      {/* TAB 1: DESKRIPSI PERUSAHAAN */}
      {tab === "deskripsi" && (
        <Card className="p-6 sm:p-8">
          <h3 className="mb-4 text-lg font-semibold">Profil Perusahaan</h3>

          <dl className="mb-6 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Meta label="Nama" value={profile.longName || profile.shortName || "-"} />
            <Meta label="Sektor" value={profile.sector || "-"} />
            <Meta label="Industri" value={profile.industry || "-"} />
            <Meta
              label="Lokasi"
              value={[profile.city, profile.country].filter(Boolean).join(", ") || "-"}
            />
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
            <p className="text-sm leading-relaxed text-muted-foreground">
              {profile.longBusinessSummary ||
                "Deskripsi perusahaan belum tersedia."}
            </p>
          </div>
        </Card>
      )}

      {/* TAB 2: PREDIKSI AI */}
      {tab === "prediksi" && (
        <Card className="p-6 sm:p-8">
          {predicting && !prediction ? (
            <Spinner label="Menjalankan model harga dan analisis fundamental..." />
          ) : !prediction ? (
            <div className="py-8 text-center">
              <Brain className="mx-auto mb-3 h-10 w-10 text-primary" />
              <p className="text-sm text-muted-foreground">
                Klik tombol di bawah buat narik prediksi AI.
              </p>
              <Button
                variant="gradient"
                className="mt-4"
                onClick={handlePredict}
                disabled={predicting}
              >
                {predicting ? "Memprediksi..." : "Mulai Prediksi"}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* judul hasil */}
              <div className="rounded-xl border border-primary/20 bg-primary-soft px-6 py-4 text-center">
                <h2 className="text-lg font-bold md:text-xl">
                  Hasil Prediksi Harga Closing Besok (Day Trading) dan Arah Tren Jangka Menengah (Swing)
                </h2>
              </div>

              {/* kartu harga prediksi + akurasi */}
              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="p-5 lg:col-span-2">
                  <h3 className="mb-4 text-base font-semibold">
                    Harga Perkiraan Closing
                  </h3>

                  <div className="space-y-3 text-sm">
                    <Row label="Close terakhir (data model)" value={fmtIDR(closeToday)} />
                    <Row label="Tanggal close (data model)" value={closeTodayDate} />
                    <Row label="Prediksi closing besok" value={fmtIDR(predClose)} />
                    <Row
                      label="Selisih terhadap close data model"
                      value={
                        <span
                          className={cn(
                            "font-bold",
                            predDelta >= 0 ? "text-success" : "text-danger"
                          )}
                        >
                          {predDelta >= 0 ? "+" : ""}
                          {fmtIDR(predDelta)} ({pricePredPct >= 0 ? "+" : ""}
                          {Number(pricePredPct).toFixed(2)}%)
                        </span>
                      }
                    />
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="mb-4 text-base font-semibold">Akurasi Prediksi</h3>

                  <div className="space-y-3 text-sm">
                    <Row
                      label="MAPE"
                      value={<span className="font-semibold">{mape.toFixed(2)}%</span>}
                    />
                    <Row label="Waktu Prediksi" value={prediction?.prediction_date || "-"} />
                  </div>

                  <div className="mt-4 rounded-lg border border-border/70 bg-muted/20 p-4 text-xs leading-relaxed text-muted-foreground">
                    <p className="font-medium text-foreground">Cara baca akurasi</p>
                    <p className="mt-1">
                      Semakin kecil nilai MAPE, semakin dekat hasil prediksi
                      model terhadap data aktual historis.
                    </p>
                  </div>
                </Card>
              </div>

              {/* rekomendasi fundamental */}
              <Card className="p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Rekomendasi (analisis fundamental)
                    </p>
                    <p className="text-lg font-bold">{recommendation}</p>
                  </div>
                  <Badge variant={recVariant}>{fundamentalDirection}</Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Stat
                    label="Return (fundamental)"
                    value={`${fundamentalReturn3M >= 0 ? "+" : ""}${fundamentalReturn3M.toFixed(2)}%`}
                    tone={fundamentalReturn3M >= 0 ? "success" : "danger"}
                  />
                  <Card className="p-4">
                    <p className="text-xs text-muted-foreground">Arah (fundamental)</p>
                    <p
                      className={cn(
                        "mt-1 text-lg font-bold",
                        fundamentalDirection === "Naik"
                          ? "text-success"
                          : "text-danger"
                      )}
                    >
                      {fundamentalDirection}
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-xs text-muted-foreground">Rekomendasi fundamental</p>
                    <span
                      className={cn(
                        "mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-semibold",
                        recommendationPillClass
                      )}
                    >
                      {recommendation}
                    </span>
                  </Card>
                </div>
              </Card>

              {/* disclaimer */}
              <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <p className="text-xs leading-relaxed text-foreground">
                  Disclaimer: prediksi menggunakan histori harga penutupan dan
                  analisis fundamental. Hasil bukan kepastian dan bukan ajakan
                  membeli atau menjual saham.
                </p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: FUNDAMENTAL */}
      {tab === "fundamental" && (
        <Card className="p-6 sm:p-8">
          {!fundamentals && !loadingFund && (
            <div className="py-8 text-center">
              <Sparkles className="mx-auto mb-3 h-10 w-10 text-primary" />
              <p className="text-sm text-muted-foreground">
                Data fundamental belum dimuat.
              </p>
              <Button
                variant="primary"
                className="mt-4"
                onClick={handleFundamentals}
              >
                Muat Data Fundamental
              </Button>
            </div>
          )}

          {loadingFund && <Spinner label="Memuat data fundamental..." />}

          {fundamentals && (
            <div className="space-y-6">
              {/* 4 KARTU UTAMA (EPS, PER, PBV, ROE) — tetap tampil di atas */}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Stat
                  label="EPS"
                  value={formatFundValue(fundamentalsRatios.eps ?? fundamental?.eps)}
                />
                <Stat
                  label="PER"
                  value={formatFundValue(
                    fundamentalsRatios.per ?? fundamentalsRatios.pe ?? fundamental?.perTTM
                  )}
                />
                <Stat
                  label="PBV"
                  value={formatFundValue(fundamentalsRatios.pbv ?? fundamental?.pbv)}
                />
                <Stat
                  label="ROE"
                  value={formatFundValue(fundamentalsRatios.roe ?? fundamental?.roe, true)}
                />
              </div>

              {/* RINGKASAN VALUASI + LABEL WARNA FIXED */}
              <Card className="p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold">Ringkasan Valuasi</h3>
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm font-semibold",
                      valuationClass // <- udah dark:variant, jadi jelas di light & dark
                    )}
                  >
                    {valuation.label}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <MiniInfo
                    label="Benchmark PER"
                    value={formatFundValue(benchmarks?.per)}
                  />
                  <MiniInfo
                    label="Benchmark PBV"
                    value={formatFundValue(benchmarks?.pbv)}
                  />
                  <MiniInfo
                    label="Benchmark ROE"
                    value={formatFundValue(benchmarks?.roe, true)}
                  />
                </div>
              </Card>

              {/* TABEL RASIO EXTRA — hanya yang belum ada di kartu atas (FIX duplikasi) */}
              {extraRatios.length > 0 && (
                <Card className="p-5">
                  <h3 className="mb-4 text-base font-semibold">
                    Rasio Fundamental Tambahan
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="px-3 py-2 font-medium">Metrik</th>
                          <th className="px-3 py-2 font-medium">Nilai</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extraRatios.map(([k, v]) => (
                          <tr key={k} className="border-b border-border/60">
                            {/* pake prettyLabel biar dict rasio jalan */}
                            <td className="px-3 py-2 font-medium">
                              {prettyLabel(k, RATIO_LABELS)}
                            </td>
                            <td className="px-3 py-2">
                              {formatFundValue(v, k.toLowerCase() === "roe")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* TABEL DATA MENTAH — FIX: label key mentah jadi bahasa manusia */}
              <Card className="p-5">
                <h3 className="mb-4 text-base font-semibold">Data Mentah</h3>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="px-3 py-2 font-medium">Keterangan</th>
                        <th className="px-3 py-2 font-medium">Nilai</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(fundamentalsRawData).length ? (
                        Object.entries(fundamentalsRawData).map(([k, v]) => (
                          <tr key={k} className="border-b border-border/60">
                            {/* label sekarang manusiawi */}
                            <td className="px-3 py-2 font-medium">
                              {prettyLabel(k, RAW_DATA_LABELS)}
                            </td>
                            <td className="px-3 py-2">{formatRawValue(k, v)}</td>
                          </tr>
                        ))
                      ) : (
                        // fallback kalau backend nggak ngasih rawData
                        <>
                          <RawRow labelKey="currentPrice" value={fundamental?.currentPrice} />
                          <RawRow labelKey="bookValuePerShare" value={fundamental?.bookValuePerShare} />
                          <RawRow labelKey="revenue" value={fundamental?.revenue} />
                          <RawRow labelKey="netIncome" value={fundamental?.netIncome} />
                          <RawRow labelKey="totalAssets" value={fundamental?.totalAssets} />
                          <RawRow labelKey="totalEquity" value={fundamental?.totalEquity} />
                          <RawRow labelKey="marketCap" value={fundamental?.marketCap} />
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
// BAGIAN 4: SUB-KOMPONEN KECIL
// ============================================================

// meta label + value (dipakai di section profil)
function Meta({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

// kartu angka + label (EPS/PER/PBV/ROE)
function Stat({ label, value, tone }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-lg font-bold",
          tone === "success" && "text-success", // hijau kalau positif
          tone === "danger" && "text-danger" // merah kalau negatif
        )}
      >
        {value}
      </p>
    </Card>
  );
}

// baris horizontal label-value (dipakai di kartu prediksi)
function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

// kotak info kecil (OHLC)
function InfoBox({ label, value }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

// kartu benchmark (PER, PBV, ROE industri)
function MiniInfo({ label, value }) {
  return (
    <div className="rounded-xl border border-border/70 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  );
}

// baris tabel raw data fallback
function RawRow({ labelKey, value }) {
  return (
    <tr className="border-b border-border/60">
      {/* labelKey diubah jadi bahasa manusia */}
      <td className="px-3 py-2 font-medium">{prettyLabel(labelKey, RAW_DATA_LABELS)}</td>
      <td className="px-3 py-2">{formatRawValue(labelKey, value)}</td>
    </tr>
  );
}

// format angka rasio (persen atau biasa)
function formatFundValue(value, isPercent = false) {
  if (value === null || value === undefined || value === "") return "-"; // kosong
  const num = Number(value); // coba jadi angka
  if (!Number.isFinite(num)) return String(value); // bukan angka -> cetak apa adanya
  if (isPercent) return `${num.toFixed(2)}%`; // tambah simbol %
  return num.toLocaleString("id-ID", { maximumFractionDigits: 2 }); // format ribuan
}

// format nilai raw — auto detect Rupiah atau angka biasa
function formatRawValue(key, value) {
  if (value === null || value === undefined || value === "") return "-";

  const lowerKey = String(key || "").toLowerCase();
  const num = Number(value);

  if (!Number.isFinite(num)) return String(value);

  if (
    lowerKey.includes("price") ||
    lowerKey.includes("cap") ||
    lowerKey.includes("revenue") ||
    lowerKey.includes("income") ||
    lowerKey.includes("assets") ||
    lowerKey.includes("equity") ||
    lowerKey.includes("bookvalue")
  ) {
    return `Rp ${Math.round(num).toLocaleString("id-ID")}`;
  }

  return num.toLocaleString("id-ID", { maximumFractionDigits: 2 });
}