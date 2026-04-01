import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Coins,
} from "lucide-react";
import { Link } from "react-router-dom";
import { apiFetch } from "@/lib/api";

function formatMarketValue(value, options = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: options.minimumFractionDigits ?? 2,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  }).format(number);
}

function formatChange(changePercent, fallback = "Data perubahan tidak tersedia") {
  const value = Number(changePercent);
  if (!Number.isFinite(value)) return fallback;
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}% dari penutupan sebelumnya`;
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

function MarketCard({ title, value, subtitle, meta, icon, unit }) {
  const isPositive = subtitle.startsWith("+");
  const isNeutral =
    subtitle === "Data perubahan tidak tersedia" ||
    subtitle.toLowerCase().includes("proxy");

  const Icon = icon;

  return (
    <div className="flex h-full min-h-[260px] flex-col justify-center rounded-3xl border border-slate-700/80 bg-slate-900/65 p-7 text-center backdrop-blur-md transition-all duration-300 hover:border-slate-500/70">
      {/* judul card */}
      <p className="mb-4 text-sm font-medium text-slate-400">{title}</p>

      <div className="flex items-center justify-center gap-4">
      <p className="text-4xl font-bold tracking-tight text-white md:text-5xl">
        {value}
      </p>
      <Icon className="h-12 w-12 shrink-0 text-slate-400/30 md:h-14 md:w-14" />
    </div>

      {/* perubahan */}
      <p
        className={`mt-3 text-base font-medium ${
          isNeutral
            ? "text-sky-400"
            : isPositive
            ? "text-green-400"
            : "text-red-400"
        }`}
      >
        {subtitle}
      </p>

      {/* meta */}
      <p className="mt-2 text-xs text-slate-500">
        {unit ? `${unit} • ` : ""}
        {meta}
      </p>
    </div>
  );
}

export default function InvestorDashboard() {
  const [stocks, setStocks] = useState([]);
  const [market, setMarket] = useState(null);
  const [isLoadingStocks, setIsLoadingStocks] = useState(true);
  const [isLoadingMarket, setIsLoadingMarket] = useState(true);

  const fetchStocks = async () => {
    setIsLoadingStocks(true);

    const { ok, data } = await apiFetch("/stocks?status=Active");

    if (ok && data.success) {
      setStocks(data.data || []);
    } else {
      setStocks([]);
    }

    setIsLoadingStocks(false);
  };

  const fetchMarketOverview = async () => {
    setIsLoadingMarket(true);
    const { ok, data } = await apiFetch("/market-overview");

    if (ok && data?.success) {
      setMarket(data.data || null);
    } else {
      setMarket(null);
    }

    setIsLoadingMarket(false);
  };

  useEffect(() => {
    fetchStocks();
    fetchMarketOverview();
  }, []);

  const topStocks = useMemo(() => {
    return stocks.slice(0, 3);
  }, [stocks]);

  const marketCards = useMemo(() => {
    if (!market) return [];

    return [
      {
        key: "ihsg",
        title: "IHSG",
        value: formatMarketValue(market.ihsg?.value),
        subtitle: formatChange(market.ihsg?.changePercent),
        meta: `Source: ${market.ihsg?.source || "yfinance"} • Update: ${
          formatLocalDateTime(market.ihsg?.updatedAt || market.ihsg?.date || "-")
        }`,
        icon: TrendingUp,
        unit: market.ihsg?.unit,
      },
      {
        key: "emas",
        title: market.emas?.label || "Harga Emas",
        value: formatMarketValue(market.emas?.value),
        subtitle: formatChange(market.emas?.changePercent),
        meta: `Source: ${market.emas?.source || "yfinance"} • Update: ${
          formatLocalDateTime(market.emas?.updatedAt || market.emas?.date || "-")
        }`,
        icon: Coins,
        unit: market.emas?.unit,
      },
    ];
  }, [market]);

  return (
    <div className="w-full space-y-12">
      <section className="rounded-3xl border border-[#4988C4]/25 bg-gradient-to-r from-[#0F2854]/55 via-[#1C4D8D]/35 to-[#4988C4]/25 p-8 backdrop-blur-md md:p-12">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
          Selamat Datang Investor!
        </h1>
        <ul className="max-w-3xl list-disc space-y-2 pl-5 text-lg text-slate-300 md:text-xl">
        <li>
          Analisis saham hanya sebagai referensi, bukan rekomendasi beli/jual.
        </li>
        <li>
          Lakukan riset tambahan sebelum membuat keputusan investasi.
        </li>
        <li>
          SokTauSaham tidak bertanggung jawab atas keuntungan atau kerugian
          yang timbul dari penggunaan platform ini.
        </li>
      </ul>
      </section>

      <section className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
          Ringkasan Pasar Hari Ini
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-400 md:text-base">
          Indikator yang dapat memengaruhi pergerakan saham Indonesia
        </p>
      </div>

      {isLoadingMarket ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/65 p-10 text-center text-slate-400 shadow-sm backdrop-blur-md">
          <p className="text-base font-medium">Memuat ringkasan pasar...</p>
          <p className="mt-2 text-sm text-slate-500">
            Mengambil data terbaru dari yfinance.
          </p>
        </div>
      ) : marketCards.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {marketCards.map((card) => (
              <MarketCard key={card.key} {...card} />
            ))}
          </div>

          {market?.note ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-200/90">
              {market.note}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/65 p-10 text-center text-slate-400 shadow-sm backdrop-blur-md">
          <p className="text-base font-medium">Ringkasan pasar gagal dimuat.</p>
          <p className="mt-2 text-sm text-slate-500">
            Coba muat ulang beberapa saat lagi.
          </p>
        </div>
      )}
    </section>

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

        {isLoadingStocks ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/65 p-10 text-center text-slate-400 backdrop-blur-md">
            Memuat data saham...
          </div>
        ) : topStocks.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {topStocks.map((stock) => {
              const isPositive = (stock.change || "").includes("+");

              return (
                <Link
                  key={stock.id}
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

                    {isPositive ? (
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
                        isPositive ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {stock.change}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/65 p-10 text-center text-slate-400 backdrop-blur-md">
            Belum ada data saham aktif.
          </div>
        )}
      </section>

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
            Perhatikan rilis berita saham dan berita ekonomi sebelum entry
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-xl text-[#BDE8F5]">•</span>
            Jika bisa menggunakan teknikal, perhatikan support/resistance dan volume untuk timing entry/exit
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-xl text-[#BDE8F5]">•</span>
            Pahami bandar dan pola pergerakan saham untuk mengantisipasi manipulasi harga
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-xl text-[#BDE8F5]">•</span>
            Disiplin untuk cut loss jika sudah di bawah 5% dari harga beli
          </li>
          <li className="flex items-start">
            <span className="mt-0.5 text-xl text-[#BDE8F5]"></span>
            Disclaimer On
          </li>
        </ul>
      </section>
    </div>
  );
}