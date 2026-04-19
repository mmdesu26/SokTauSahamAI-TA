// HOME PAGE — gabungin landing + dashboard
// flow: Hero -> Ringkasan Pasar -> Service -> Why Us -> CTA
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp, TrendingDown, Coins, ArrowRight, Sparkles, ShieldCheck, Brain,
  LineChart, Search, BookOpen, Zap, Lock, Users, Layers3
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import StockLogo from "@/components/ui/StockLogo";

// ===== HELPERS =====
// formatter angka — Indonesia style 2 decimal
function fmt(n, d = 2) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "-";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: d, maximumFractionDigits: d,
  }).format(num);
}

// formatter perubahan persen — kasih + di depan kalo positif
function fmtChange(p) {
  const v = Number(p);
  if (!Number.isFinite(v)) return "Data perubahan tidak tersedia";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

export default function Home() {
  // state market overview & top stocks
  const [market, setMarket] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [loadingStocks, setLoadingStocks] = useState(true);

  // narik data pas page mount
  useEffect(() => {
    (async () => {
      setLoadingMarket(true);
      const r = await apiFetch("/market-overview");
      setMarket(r.ok && r.data?.success ? r.data.data : null);
      setLoadingMarket(false);
    })();

    (async () => {
      setLoadingStocks(true);
      const r = await apiFetch("/stocks?status=Active");
      setStocks(r.ok && r.data?.success ? r.data.data || [] : []);
      setLoadingStocks(false);
    })();
  }, []);

  // ambil 3 saham populer aja buat preview
  const topStocks = useMemo(() => stocks.slice(0, 3), [stocks]);

  return (
    <div className="space-y-24 pb-12">
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-10 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pt-24">
          <div className="animate-fade-up">
            <Badge variant="primary" className="mb-6"><Sparkles className="h-3 w-3" /> Platform analisis saham dengan AI</Badge>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Investasi cerdas dengan <span className="text-gradient">pengalaman visual yang lebih hidup</span></h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">Pantau pasar, pantau berita keuangan, analisis fundamental, dan dapatkan prediksi harga
              dengan machine learning. Dirancang untuk para investor.
          </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/stocks"><Button variant="gradient" size="lg">Mulai cari saham <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link to="/glossary"><Button variant="outline" size="lg">Pelajari istilah <BookOpen className="h-4 w-4" /></Button></Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["Insight pasar", "Ringkasan indikator harian untuk memahami sentimen pasar."],
                ["Analisis cepat", "Akses profil, fundamental, dan pergerakan harga dalam satu flow."],
                ["Belajar bertahap", "Glosarium membantu investor baru memahami istilah penting."],
              ].map(([t, d]) => (
                <div key={t} className="rounded-2xl border border-border/70 bg-card/55 p-4 backdrop-blur-sm">
                  <p className="text-sm font-semibold">{t}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-primary opacity-20 blur-3xl" />
            <Card className="mesh-surface relative overflow-hidden p-6 sm:p-7">
              <div className="absolute right-5 top-5 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">Live AI preview</div>
              <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Layers3 className="h-6 w-6" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Simulasi dashboard</p>
                      <p className="text-xl font-bold">BBCA • TLKM • ASII</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/70 p-4 backdrop-blur-sm">
                    <p className="text-sm font-medium">Prediksi 1 bulan</p>
                    <p className="mt-1 text-3xl font-bold">+4.82%</p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Dipadukan dengan konteks fundamental agar proyeksi lebih mudah dibaca dan tidak berdiri sendiri.</p>
                    <div className="mt-4 flex items-end gap-1.5">
                      {[36, 52, 44, 60, 58, 73, 82, 76].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t-md bg-gradient-primary opacity-90 animate-float" style={{ height: `${h}px`, animationDelay: `${i * 0.12}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border/70 bg-background/70 p-4 backdrop-blur-sm">
                    <p className="text-sm text-muted-foreground">Saham populer</p>
                    <div className="mt-3 space-y-3">
                      {topStocks.length ? topStocks.map((s) => {
                        const up = String(s.change || "").includes("+");
                        return (
                          <div key={s.id} className="flex items-center justify-between rounded-xl bg-card/80 px-3 py-2">
                            <div>
                              <p className="text-sm font-semibold">{s.ticker}</p>
                              <p className="text-[11px] text-muted-foreground line-clamp-1">{s.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">Rp {s.price}</p>
                              <p className={up ? "text-xs text-success" : "text-xs text-danger"}>{s.change}</p>
                            </div>
                          </div>
                        );
                      }) : <p className="text-xs text-muted-foreground">Data saham akan tampil di sini.</p>}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/70 p-4 backdrop-blur-sm">
                    <p className="text-sm text-muted-foreground">Benefit utama</p>
                    <ul className="mt-3 space-y-2 text-sm">
                      <li>• Visual lebih imersif dan berlapis</li>
                      <li>• Konten investor lebih lengkap</li>
                      <li>• Navigasi lebih cepat dipahami</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ============ RINGKASAN PASAR ============ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Ringkasan Pasar Hari Ini</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Indikator yang dapat memengaruhi pergerakan saham Indonesia
          </p>
        </div>

        {loadingMarket ? (
          <Card className="p-12"><Spinner label="Memuat ringkasan pasar..." /></Card>
        ) : market ? (
          // 2 card sejajar: IHSG & Emas
          <div className="grid gap-4 sm:grid-cols-2">
            <MarketCard
              title="IHSG"
              value={fmt(market.ihsg?.value)}
              change={fmtChange(market.ihsg?.changePercent)}
              icon={TrendingUp}
              meta={market.ihsg?.unit}
            />
            <MarketCard
              title={market.emas?.label || "Harga Emas"}
              value={fmt(market.emas?.value)}
              change={fmtChange(market.emas?.changePercent)}
              icon={Coins}
              meta={market.emas?.unit}
            />
          </div>
        ) : (
          <Card className="p-12 text-center text-muted-foreground">
            Ringkasan pasar gagal dimuat. Coba beberapa saat lagi.
          </Card>
        )}

        {/* preview top stocks */}
        <div className="mt-12">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-bold">Saham Populer</h3>
            <Link to="/stocks" className="text-sm font-medium text-primary hover:opacity-80">
              Lihat semua <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </div>

          {loadingStocks ? (
            <Card className="p-8"><Spinner label="Memuat data saham..." /></Card>
          ) : topStocks.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topStocks.map((s) => {
              const up = (s.change || "").includes("+");

              return (
                <Link key={s.id} to={`/stocks/${s.ticker}`} className="block">
                  <Card className="group cursor-pointer p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <StockLogo
                          ticker={s.ticker}
                          website={s.website}
                          logoUrl={s.logo_url}
                          size="md"
                        />

                        <div className="min-w-0">
                          <p className="text-lg font-bold">{s.ticker}</p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {s.name}
                          </p>
                        </div>
                      </div>

                      {up ? (
                        <TrendingUp className="h-5 w-5 shrink-0 text-success" />
                      ) : (
                        <TrendingDown className="h-5 w-5 shrink-0 text-danger" />
                      )}
                    </div>

                    <div className="flex items-baseline justify-between">
                      <p className="text-xl font-semibold">Rp {s.price}</p>
                      <span className={up ? "text-sm text-success" : "text-sm text-danger"}>
                        {s.change}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
                      <span className="text-xs text-muted-foreground">
                        Klik untuk buka halaman saham
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                        Lihat Detail
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
            </div>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              Belum ada data saham.
            </Card>
          )}
        </div>
      </section>

      {/* ============ SERVICE ============ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <Badge variant="primary" className="mb-3">Layanan Kami</Badge>
          <h2 className="text-2xl font-bold sm:text-3xl">Semua yang kamu butuh dalam satu tempat</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Dirancang biar proses analisis saham jadi lebih simpel & cepat.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Search, title: "Cari Saham", desc: "Temukan saham IDX dgn pencarian cepat & data yang selalu diperbarui." },
            { icon: LineChart, title: "Chart & Indikator", desc: "Lihat candlestick, tren harga, dan indikator fundamental." },
            { icon: Brain, title: "Prediksi AI", desc: "Prediksi harga 1 hari ke depan dengan ML (Random Forest + Linear Regression)." },
            { icon: BookOpen, title: "Glosarium Lengkap", desc: "Pahami istilah saham yang sering bikin bingung pemula." },
            { icon: ShieldCheck, title: "Data Terpercaya", desc: "Bersumber dari yfinance & literatur resmi pasar modal." },
            { icon: Zap, title: "Cepat & Ringan", desc: "Interface modern, smooth di laptop & HP." },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.title} className="p-6 transition-all hover:border-primary/40 hover:shadow-soft">
                {/* icon container — ukuran fix biar konsisten */}
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1 text-base font-semibold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ============ WHY CHOOSE US ============ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge variant="primary" className="mb-3">Why Choose Us</Badge>
            <h2 className="text-2xl font-bold sm:text-3xl">
              Dibangun untuk investor yang serius soal data
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Kombinasi machine learning + analisis fundamental, dikemas dalam UI
              minimal yang gak bikin overwhelmed.
            </p>

            <div className="mt-8 space-y-4">
              {[
                { icon: Brain, title: "AI yang transparan", desc: "Setiap prediksi disertai metrik akurasi (MAPE)." },
                { icon: BookOpen, title: "Glosarium Lengkap", desc: "Pahami istilah saham yang sering bikin bingung pemula." },
                { icon: ShieldCheck, title: "Tidak Ribet", desc: "Tidak perlu daftar akun atau login." },
                { icon: Users, title: "Buat semua level", desc: "Dari pemula sampai analis, semua dapet tools yg pas." },
              ].map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{b.title}</p>
                      <p className="text-sm text-muted-foreground">{b.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* visual side — preview card mockup */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-primary opacity-20 blur-3xl" />
            <Card className="relative p-6 animate-float">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Prediksi 1 Hari ke Depan</p>
                  <p className="text-2xl font-bold">BBCA.JK</p>
                </div>
                <Badge variant="success">+4.8%</Badge>
              </div>
              {/* mock chart bars — pure CSS, gak butuh library */}
              <div className="flex h-32 items-end gap-1.5">
                {[40, 60, 45, 70, 55, 80, 65, 90, 75, 95, 85, 100].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-md bg-gradient-primary opacity-80"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>Rp 9.450</span>
                <span>MAPE 2.34%</span>
                <span>Rp 9.900</span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Card className="overflow-hidden border-0 bg-gradient-primary p-10 text-center text-primary-foreground shadow-lift sm:p-16">
          <h2 className="text-2xl font-bold sm:text-3xl">Siap mulai analisis sahammu?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm opacity-90 sm:text-base">
            Akses semua tools investor — gratis, tanpa daftar.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/stocks">
              <Button size="lg" className="bg-background text-foreground hover:bg-background/90">
                Cari Saham <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/glossary">
              <Button variant="outline" size="lg" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                Buka Glosarium
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}

// sub-component buat market card — biar gak duplicate
function MarketCard({ title, value, change, icon, meta }) {
  const Icon = icon;
  // tone otomatis dari prefix change
  const positive = change.startsWith("+");
  const neutral = change.includes("tidak tersedia");

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Badge variant={neutral ? "default" : positive ? "success" : "danger"}>
          {change}
        </Badge>
        {meta && <span className="text-xs text-muted-foreground">{meta}</span>}
      </div>
    </Card>
  );
}
