// Layout investor — Navbar atas + main content + footer
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import ConfirmModal from "@/components/ConfirmModal";

export default function InvestorLayout() {
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    document.title = "SokTauSaham — Investasi cerdas dengan AI";
  }, []);

  // nav items investor — Home / Cari Saham / Glosarium
  const items = [
    { name: "Home", link: "/" },
    { name: "Cari Saham", link: "/stocks" },
    { name: "Glosarium", link: "/glossary" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar items={items} />

      <ConfirmModal
        open={showLogout}
        title="Yakin ingin kembali?"
        description="Anda akan keluar dari halaman ini."
        confirmText="Ya, kembali"
        tone="destructive"
        onCancel={() => setShowLogout(false)}
        onConfirm={() => { setShowLogout(false); navigate("/"); }}
      />

      {/* main — kasih padding top biar gak ketiban navbar fixed */}
      <main className="pt-16">
        {/* hero glow halus di belakang konten utama */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-hero-glow" />
          <div className="relative">
            <Outlet />
          </div>
        </div>
      </main>

      {/* footer simpel */}
      <footer className="mt-20 border-t border-border bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
          © {new Date().getFullYear()} SokTauSaham — Platform analisis saham berbasis AI.
        </div>
      </footer>
    </div>
  );
}
