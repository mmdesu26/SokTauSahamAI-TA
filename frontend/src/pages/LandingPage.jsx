import { Link } from "react-router-dom";
import { TrendingUp, BarChart3, Brain, Settings, Users, Zap } from "lucide-react";
import BoxesWrapper from "@/components/BoxesBg";
import GlareCardWrapper from "@/components/GlareCardWrapper";
import AuroraTextWrapper from "@/components/AuroraText";
import Button from "@/components/Button";
import GenerateText from "@/components/GenerateText";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-primary-dark via-primary to-primary-dark">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-primary/20 bg-primary-dark/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-bg-light">SokTauSaham</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <BoxesWrapper className="px-4 pt-32 pb-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-block rounded-full border border-bg-light/30 bg-primary/10 px-4 py-2">
            <span className="text-sm font-semibold text-bg-light">
              Platform Analisis Saham Terpadu
            </span>
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-tight text-bg-light md:text-6xl">
            Prediksi Saham dengan{" "}
            <AuroraTextWrapper>AI Canggih</AuroraTextWrapper>
          </h1>

          <p className="mx-auto mb-12 max-w-2xl text-xl leading-relaxed text-bg-light/80">
            Platform analisis saham terintegrasi dengan prediksi harga machine learning,
            data fundamental berupa rasio, dan rekomendasi trading.
          </p>

          <Link to="/investor/dashboard" className="group relative inline-block">
            <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-primary to-accent opacity-75 blur transition group-hover:opacity-100" />
            <Button>
              <GenerateText text="Mulai Analisis Sekarang ➜" />
            </Button>
          </Link>
        </div>

        {/* Features Overview */}
<div className="mx-auto max-w-6xl px-4 py-20">
  <h2 className="mb-12 text-center text-3xl font-bold text-bg-light">
    Fitur Lengkap untuk Investor & Administrator
  </h2>

  <div className="mx-auto max-w-4xl">
    <div className="grid items-stretch gap-50 md:grid-cols-2">
      {/* Investor Features */}
      <GlareCardWrapper className="h-full min-h-[360px] w-full rounded-[48px] border border-primary/30 bg-primary-dark/40 p-8 transition hover:border-accent/60">
        <div className="flex h-full flex-col justify-center">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-bg-light">Untuk Investor</h3>
          </div>

          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <BarChart3 className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
              <span className="text-bg-light/80">
                Grafik OHLC setiap saham untuk visualisasi
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Brain className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
              <span className="text-bg-light/80">
                Prediksi harga dan tren dengan model Machine Learning
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Zap className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
              <span className="text-bg-light/80">
                Rasio fundamental dari yfinance API dan rekomendasi Buy/Sell
              </span>
            </li>
          </ul>
        </div>
      </GlareCardWrapper>

      {/* Admin Features */}
      <GlareCardWrapper className="h-full min-h-[360px] w-full rounded-[48px] border border-primary/30 bg-primary-dark/40 p-8 transition hover:border-accent/60">
        <div className="flex h-full flex-col justify-center">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
              <Settings className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-bg-light">Untuk Administrator</h3>
          </div>

          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <BarChart3 className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
              <span className="text-bg-light/80">
                Manajemen data master saham (CRUD) dari API yFinance
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Brain className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
              <span className="text-bg-light/80">
                Tombol kontrol untuk menjalankan sistem analisis
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
              <span className="text-bg-light/80">
                Monitoring sistem dan log error
              </span>
            </li>
          </ul>
        </div>
      </GlareCardWrapper>
    </div>
  </div>
</div>

        {/* How It Works */}
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="mb-12 text-center text-3xl font-bold text-bg-light">
            Cara Kerja Platform
          </h2>

          <div className="grid items-stretch gap-8 md:grid-cols-3">
            <GlareCardWrapper className="h-full min-h-[320px] w-full rounded-[48px] border border-primary/30 bg-primary-dark/40 p-8 transition hover:border-accent/60">
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                  <span className="text-2xl font-bold text-bg-light">1</span>
                </div>
                <h4 className="mb-2 text-lg font-semibold text-bg-light">
                  Data Collection
                </h4>
                <p className="text-bg-light/70">
                  Sistem mengumpulkan data saham yang update dari API yFinance.
                </p>
              </div>
            </GlareCardWrapper>

            <GlareCardWrapper className="h-full min-h-[320px] w-full rounded-[48px] border border-primary/30 bg-primary-dark/40 p-8 transition hover:border-accent/60">
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                  <span className="text-2xl font-bold text-bg-light">2</span>
                </div>
                <h4 className="mb-2 text-lg font-semibold text-bg-light">
                  AI Processing
                </h4>
                <p className="text-bg-light/70">
                  Model Machine Learning menganalisis tren dan memprediksi pergerakan harga.
                </p>
              </div>
            </GlareCardWrapper>

            <GlareCardWrapper className="h-full min-h-[320px] w-full rounded-[48px] border border-primary/30 bg-primary-dark/40 p-8 transition hover:border-accent/60">
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                  <span className="text-2xl font-bold text-bg-light">3</span>
                </div>
                <h4 className="mb-2 text-lg font-semibold text-bg-light">
                  Insights & Actions
                </h4>
                <p className="text-bg-light/70">
                  Investor menerima rekomendasi dan analisis untuk pengambilan keputusan yang lebih rasional.
                </p>
              </div>
            </GlareCardWrapper>
          </div>
        </div>
      </BoxesWrapper>
    </div>
  );
}