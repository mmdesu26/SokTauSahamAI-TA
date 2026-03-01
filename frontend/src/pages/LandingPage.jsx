import { Link } from "react-router-dom"
import {
  TrendingUp,
  BarChart3,
  Brain,
  Settings,
  Users,
  Zap,
} from "lucide-react"
import GradientSection from "@/components/GradientBg"
import CometCardWrapper from "@/components/CometCard"
import MovingCardsWrapper from "@/components/MovingCard"
import AuroraTextWrapper from "@/components/AuroraText"
import Button from "@/components/Button";
import GenerateText from "@/components/GenerateText";

export default function LandingPage() {
  const howItWorksItems = [
    {
      quote: "Sistem mengumpulkan data saham yang update dari API yFinance",
      name: "Data Collection",
      title: "Step 1",
    },
    {
      quote: "Model ML menganalisis tren dan memprediksi pergerakan harga",
      name: "AI Processing",
      title: "Step 2",
    },
    {
      quote: "Investor menerima rekomendasi dan analisis untuk keputusan tepat",
      name: "Insights & Actions",
      title: "Step 3",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">SokTauSaham</span>
          </div>
          <Link to="/login">
            <Button>
              Masuk
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <GradientSection className="pt-32 pb-20 px-4">    
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-6 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
              <span className="text-cyan-400 text-sm font-semibold">
                Platform Analisis Saham Terpadu
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Prediksi Saham dengan{" "}
                <AuroraTextWrapper>
                  AI Canggih
                </AuroraTextWrapper>
            </h1>

            <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              Platform analisis saham terintegrasi dengan prediksi harga machine learning, 
              data fundamental berupa rasio, dan rekomendasi trading.
            </p>

            <Link to="/login" className="group relative inline-block">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg opacity-75 group-hover:opacity-100 transition blur" />
                 <Button>
                  <GenerateText text="Mulai Analisis Sekarang ➜" />
                </Button>
            </Link>
          </div>

      {/* Features Overview */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-white mb-12 text-center">
          Fitur Lengkap untuk Investor & Administrator
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Investor Features */}
        <CometCardWrapper className="bg-slate-900/50 border border-cyan-500/20 p-8 rounded-xl hover:border-cyan-500/50 transition">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Untuk Investor</h3>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <BarChart3 className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-300">
                Grafik OHLC setiap saham untuk visualisasi 
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-300">
                Prediksi harga & tren dengan model Machine Learning
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-300">
                Rasio fundamental dari yfinance API & rekomendasi Buy/Sell
              </span>
            </li>
          </ul>
        </CometCardWrapper>

{/* Admin Features */}
<CometCardWrapper className="bg-slate-900/50 border border-orange-500/20 p-8 rounded-xl hover:border-orange-500/50 transition">
  <div className="flex items-center gap-3 mb-6">
    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
      <Settings className="w-6 h-6 text-orange-400" />
    </div>
    <h3 className="text-xl font-semibold text-white">Untuk Administrator</h3>
  </div>

  <ul className="space-y-3">
    <li className="flex items-start gap-3">
      <BarChart3 className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
      <span className="text-slate-300">
        Manajemen data master saham (CRUD) dari API yFinance
      </span>
    </li>
    <li className="flex items-start gap-3">
      <Brain className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
      <span className="text-slate-300">
        Tombol kontrol untuk menjalankan sistem analisis
      </span>
    </li>
    <li className="flex items-start gap-3">
      <Users className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
      <span className="text-slate-300">
        Monitoring sistem, dan log error
      </span>
    </li>
  </ul>
</CometCardWrapper>
      </div>
      </div>

      {/* How It Works */}
        <div className="max-w-6xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">
            Cara Kerja Platform
          </h2>
          <MovingCardsWrapper
            items={howItWorksItems}
            direction="left"
            speed="normal"
            pauseOnHover={true}
            className="max-w-6xl mx-auto"
          />
      </div>
            </GradientSection>
    </div>
  )
}
