import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import ResizableNavbarWrapper from "@/components/ResizableNavbar"; // sesuaikan path kalau beda

export default function InvestorLayout() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Ambil data user dari localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userEmail = user?.email || "investor@example.com";

  const handleLogoutClick = () => setShowLogoutModal(true);

  const handleConfirmLogout = () => {
    localStorage.removeItem("user");
    setShowLogoutModal(false);
    navigate("/login");
  };

  // Menu navigasi investor
  const navItems = [
    { name: "Dashboard", link: "/investor/dashboard" },
    { name: "Cari Saham", link: "/investor/stocks" },
    { name: "Glosarium", link: "/investor/glossary" },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col">
      {/* Resizable Floating Navbar */}
      <ResizableNavbarWrapper
        brand="SokTauSaham"
        items={navItems}
        onLogout={handleLogoutClick}
        className="dark"
      />

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-7 max-w-sm w-full shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-red-500/15 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Yakin ingin keluar?</h3>
            </div>

            <p className="text-slate-300 mb-8 leading-relaxed">
              Anda akan keluar dari akun dan harus login kembali untuk mengakses platform.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 px-5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 py-3 px-5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition font-medium"
              >
                Ya, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full overflow-y-auto pt-16 md:pt-0">
        <div className="w-full h-full">
          <div className="w-full px-5 sm:px-8 md:px-10 lg:px-12 xl:px-16 py-2 md:py-10 lg:py-12">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}