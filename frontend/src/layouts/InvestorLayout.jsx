import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import ResizableNavbarWrapper from "@/components/ResizableNavbar";
import BoxesWrapper from "@/components/BoxesBg";

export default function InvestorLayout() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => setShowLogoutModal(true);

  const handleConfirmLogout = () => {
    localStorage.removeItem("user");
    setShowLogoutModal(false);
    navigate("/");
  };

  const navItems = [
    { name: "Dashboard", link: "/investor/dashboard" },
    { name: "Cari Saham", link: "/investor/stocks" },
    { name: "Glosarium", link: "/investor/glossary" },
  ];

  return (
    <BoxesWrapper className="min-h-screen w-full">
      <div className="fixed top-0 left-0 z-50 w-full">
        <ResizableNavbarWrapper
          brand="SokTauSaham"
          items={navItems}
          onLogout={handleLogoutClick}
          className="dark"
        />
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary-dark/80 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-primary/25 bg-primary-dark/70 p-7 shadow-2xl backdrop-blur-sm">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/15">
                <AlertCircle className="h-7 w-7 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-bg-light">
                Yakin ingin kembali?
              </h3>
            </div>

            <p className="mb-8 leading-relaxed text-bg-light/75">
              Anda akan keluar dari halaman ini.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 rounded-xl border border-primary/20 bg-primary/20 px-5 py-3 font-medium text-bg-light transition hover:bg-primary/30"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 rounded-xl bg-red-600 px-5 py-3 font-medium text-white transition hover:bg-red-700"
              >
                Ya, Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="relative z-10 min-h-screen w-full pt-24">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </BoxesWrapper>
  );
}