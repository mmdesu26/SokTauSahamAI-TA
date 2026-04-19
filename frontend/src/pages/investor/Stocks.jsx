import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  ShieldCheck,
  BookOpen,
  Target,
  ArrowRight,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import StockLogo from "@/components/ui/StockLogo";

export default function Stocks() {
  const [q, setQ] = useState("");
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const r = await apiFetch("/stocks?status=Active");
      setStocks(r.ok && r.data?.success ? r.data.data || [] : []);
      setLoading(false);
    })();
  }, []);

  const fmtIDR = (n) =>
  Number.isFinite(Number(n))
    ? `Rp ${Math.round(Number(n)).toLocaleString("id-ID")}`
    : "Rp 0";

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return stocks;

    return stocks.filter(
      (x) =>
        x.ticker?.toLowerCase().includes(s) ||
        x.name?.toLowerCase().includes(s)
    );
  }, [stocks, q]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
      <header className="text-center">
        <Badge variant="primary" className="mb-3">
          Pencarian
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Cari Saham
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Temukan emiten IDX yang ingin kamu analisis & prediksi.
        </p>
      </header>

      <div className="mx-auto max-w-2xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari ticker atau nama saham (cth: BBCA, Telkom...)"
            className="h-12 pl-11 text-base"
          />
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {filtered.length} saham{" "}
            {q && (
              <span className="text-muted-foreground">untuk "{q}"</span>
            )}
          </h2>
        </div>

        {loading ? (
          <Card className="p-12">
            <Spinner label="Memuat data saham..." />
          </Card>
        ) : filtered.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => {
              const up = String(s.change || "").includes("+");

              return (
                <Link
                  key={s.id}
                  to={`/stocks/${s.ticker}`}
                  className="block"
                >
                  <Card className="group flex h-full cursor-pointer items-center gap-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft">
                    <StockLogo
                      ticker={s.ticker}
                      website={s.website}
                      logoUrl={s.logo_url}
                      size="lg"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-base font-bold">
                          {s.ticker}
                        </p>
                        {up ? (
                          <TrendingUp className="h-4 w-4 shrink-0 text-success" />
                        ) : (
                          <TrendingDown className="h-4 w-4 shrink-0 text-danger" />
                        )}
                      </div>

                      <p className="truncate text-xs text-muted-foreground">
                        {s.name}
                      </p>

                      <div className="mt-2 flex items-baseline justify-between">
                        <p className="text-sm font-semibold">{fmtIDR(s.price)}</p>
                        <span className={`text-xs font-medium ${up ? "text-success" : "text-danger"}`}>
                          {s.change}
                        </span>           
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
                        <span className="text-xs text-muted-foreground">
                          Klik untuk lihat detail
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                          Lihat Detail
                          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center text-muted-foreground">
            Tidak ditemukan saham dengan kata kunci "{q}".
          </Card>
        )}
      </section>

      <section>
      <div className="mb-8 text-center">
        <Badge variant="primary" className="mb-3">
          <Lightbulb className="h-3 w-3" /> Tips
        </Badge>
        <h2 className="text-2xl font-bold sm:text-3xl">
          Tips Investasi untuk Pemula
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Hal dasar yg wajib dipahami sebelum beli saham pertama kamu.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: BookOpen,
            title: "Pahami dulu",
            desc: "Belajar istilah dasar (EPS, PER, PBV, ROE) sebelum nyemplung.",
          },
          {
            icon: Target,
            title: "Tentukan tujuan",
            desc: "Investasi jangka pendek (Day Trading) vs panjang (swing) punya strategi beda.",
          },
          {
            icon: ShieldCheck,
            title: "Diversifikasi",
            desc: "Jangan taruh semua dana di 1 saham — sebar risikonya.",
          },
          {
            icon: Lightbulb,
            title: "Riset sendiri",
            desc: "Prediksi AI cuma referensi, keputusan tetep di kamu. Jangan lupa lihat berita.",
          },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <Card
              key={t.title}
              className="h-full border border-border bg-card p-6 shadow-sm"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-primary">
                <Icon className="h-5 w-5" />
              </div>

              <h3 className="mb-2 text-base font-semibold text-foreground">
                {t.title}
              </h3>

              <p className="text-sm leading-relaxed text-muted-foreground">
                {t.desc}
              </p>
            </Card>
          );
        })}
      </div>
    </section>
    </div>
  );
}