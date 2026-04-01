import { Link } from "react-router-dom";
import {
  TrendingUp,
  BarChart3,
  Brain,
  BookOpen,
  LineChart,
  ShieldAlert,
} from "lucide-react";
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
            <span className="text-lg font-bold text-bg-light">
              SokTauSaham
            </span>
          </div>
        </div>
      </nav>

      <BoxesWrapper className="px-4 pb-20 pt-32">
        {/* Hero */}
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-block rounded-full border border-bg-light/30 bg-primary/10 px-4 py-2">
            <span className="text-sm font-semibold text-bg-light">
              Platform Analisis Saham untuk Investor
            </span>
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-tight text-bg-light md:text-6xl">
            Analisis Saham dengan{" "}
            <AuroraTextWrapper>Data dan AI</AuroraTextWrapper>
          </h1>

          <p className="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-bg-light/80">
            Pantau ringkasan pasar, lihat visualisasi pergerakan harga saham,
            pelajari fundamental perusahaan, dan jalankan prediksi harga saham
            untuk membantu pengambilan keputusan investasi secara lebih terarah.
          </p>

          <Link to="/investor/dashboard" className="group relative inline-block">
            <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-primary to-accent opacity-75 blur transition group-hover:opacity-100" />
            <Button>
              <GenerateText text="Masuk ke Dashboard Investor ➜" />
            </Button>
          </Link>
        </div>

        {/* Fitur Investor */}
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="mb-4 text-center text-3xl font-bold text-bg-light">
            Fitur Utama untuk Investor
          </h2>
          <p className="mx-auto mb-12 max-w-3xl text-center text-bg-light/70">
            Semua fitur difokuskan untuk membantu investor memahami kondisi
            pasar, membaca data saham, dan melihat hasil analisis sistem.
          </p>

          <div className="grid items-stretch gap-8 md:grid-cols-2 xl:grid-cols-3">
            <GlareCardWrapper className="h-full min-h-[280px] w-full rounded-[40px] border border-primary/30 bg-primary-dark/40 p-8 transition hover:border-accent/60">
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20">
                  <LineChart className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-bg-light">
                  Ringkasan Pasar
                </h3>
                <p className="leading-relaxed text-bg-light/75">
                  Pantau indikator pasar seperti IHSG dan harga emas sebagai
                  gambaran kondisi pasar yang dapat memengaruhi pergerakan saham.
                </p>
              </div>
            </GlareCardWrapper>

            <GlareCardWrapper className="h-full min-h-[280px] w-full rounded-[40px] border border-primary/30 bg-primary-dark/40 p-8 transition hover:border-accent/60">
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20">
                  <BarChart3 className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-bg-light">
                  Visualisasi Grafik Saham
                </h3>
                <p className="leading-relaxed text-bg-light/75">
                  Lihat pergerakan harga saham melalui grafik OHLC dalam beberapa
                  timeframe untuk membantu membaca pola pergerakan harga.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-amber-300">
                  Grafik saham hanya digunakan sebagai visualisasi data dan tidak
                  digunakan dalam proses perhitungan prediksi machine learning.
                </p>
              </div>
            </GlareCardWrapper>

            <GlareCardWrapper className="h-full min-h-[280px] w-full rounded-[40px] border border-primary/30 bg-primary-dark/40 p-8 transition hover:border-accent/60">
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20">
                  <BookOpen className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-bg-light">
                  Profil & Glosarium
                </h3>
                <p className="leading-relaxed text-bg-light/75">
                  Pelajari profil perusahaan, ringkasan bisnis, dan istilah pasar
                  modal untuk membantu memahami informasi saham dengan lebih baik.
                </p>
              </div>
            </GlareCardWrapper>

            <GlareCardWrapper className="h-full min-h-[280px] w-full rounded-[40px] border border-primary/30 bg-primary-dark/40 p-8 transition hover:border-accent/60">
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-bg-light">
                  Fundamental Perusahaan
                </h3>
                <p className="leading-relaxed text-bg-light/75">
                  Tinjau data fundamental seperti EPS, PER, PBV, dan ROE yang
                  diambil dari yfinance sebagai dasar analisis saham.
                </p>
              </div>
            </GlareCardWrapper>

            <GlareCardWrapper className="h-full min-h-[280px] w-full rounded-[40px] border border-primary/30 bg-primary-dark/40 p-8 transition hover:border-accent/60">
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20">
                  <Brain className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-bg-light">
                  Prediksi Harga 1 Bulan
                </h3>
                <p className="leading-relaxed text-bg-light/75">
                  Sistem menghasilkan prediksi harga penutupan 1 bulan berdasarkan
                  data historis dan rasio fundamental menggunakan model machine
                  learning.
                </p>
              </div>
            </GlareCardWrapper>

            <GlareCardWrapper className="h-full min-h-[280px] w-full rounded-[40px] border border-primary/30 bg-primary-dark/40 p-8 transition hover:border-accent/60">
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20">
                  <ShieldAlert className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-bg-light">
                  Analisis sebagai Referensi
                </h3>
                <p className="leading-relaxed text-bg-light/75">
                  Hasil analisis dan prediksi hanya sebagai referensi dan tidak
                  menjamin hasil investasi.
                </p>
              </div>
            </GlareCardWrapper>
          </div>
        </div>

        {/* Cara Kerja */}
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="mb-4 text-center text-3xl font-bold text-bg-light">
            Cara Kerja Platform
          </h2>
          <p className="mx-auto mb-12 max-w-3xl text-center text-bg-light/70">
            Alur penggunaan platform dirancang sederhana agar investor dapat
            langsung membaca kondisi pasar, memilih saham, dan melihat hasil
            analisis dengan cepat.
          </p>

          <div className="grid items-stretch gap-8 md:grid-cols-3">
            <GlareCardWrapper className="h-full min-h-[320px] w-full rounded-[40px] border border-primary/30 bg-primary-dark/40 p-8 transition hover:border-accent/60">
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                  <span className="text-2xl font-bold text-bg-light">1</span>
                </div>
                <h4 className="mb-3 text-lg font-semibold text-bg-light">
                  Lihat Kondisi Pasar
                </h4>
                <p className="leading-relaxed text-bg-light/70">
                  Investor memulai dari dashboard untuk melihat ringkasan pasar
                  seperti IHSG, emas, dan daftar saham yang tersedia.
                </p>
              </div>
            </GlareCardWrapper>

            <GlareCardWrapper className="h-full min-h-[320px] w-full rounded-[40px] border border-primary/30 bg-primary-dark/40 p-8 transition hover:border-accent/60">
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                  <span className="text-2xl font-bold text-bg-light">2</span>
                </div>
                <h4 className="mb-3 text-lg font-semibold text-bg-light">
                  Analisis Saham Pilihan
                </h4>
                <p className="leading-relaxed text-bg-light/70">
                  Investor membuka detail saham untuk melihat visualisasi grafik,
                  profil perusahaan, ringkasan bisnis, dan data fundamental dari
                  yfinance.
                </p>
              </div>
            </GlareCardWrapper>

            <GlareCardWrapper className="h-full min-h-[320px] w-full rounded-[40px] border border-primary/30 bg-primary-dark/40 p-8 transition hover:border-accent/60">
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                  <span className="text-2xl font-bold text-bg-light">3</span>
                </div>
                <h4 className="mb-3 text-lg font-semibold text-bg-light">
                  Jalankan Prediksi
                </h4>
                <p className="leading-relaxed text-bg-light/70">
                  Sistem menampilkan prediksi harga penutupan 1 bulan, arah tren,
                  dan ringkasan hasil model sebagai bahan pertimbangan tambahan.
                </p>
              </div>
            </GlareCardWrapper>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mx-auto max-w-6xl px-4 pb-8">
          <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-6 backdrop-blur-md">
            <h3 className="mb-3 text-xl font-semibold text-amber-200">
              Disclaimer
            </h3>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-slate-200">
              <li>
                Analisis saham pada platform ini hanya sebagai referensi, bukan
                rekomendasi beli atau jual.
              </li>
              <li>
                Investor tetap disarankan melakukan riset tambahan sebelum
                mengambil keputusan investasi.
              </li>
              <li>
                Hasil prediksi machine learning tidak menjamin keuntungan dan
                tidak dapat dianggap sebagai kepastian pergerakan harga.
              </li>
            </ul>
          </div>
        </div>
      </BoxesWrapper>
    </div>
  );
}