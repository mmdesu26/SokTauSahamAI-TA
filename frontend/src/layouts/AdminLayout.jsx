import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import ResizableNavbarWrapper from "@/components/ResizableNavbar"; // sesuaikan path kalau beda

export default function AdminLayout() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Ambil data user dari localStorage (sama seperti investor)
  const user = JSON.parse(localStorage.getItem("admin") || "{}");
  const userEmail = user?.email || "admin@example.com";

  const handleLogoutClick = () => setShowLogoutModal(true);

  const handleConfirmLogout = () => {
    localStorage.removeItem("admin");
    setShowLogoutModal(false);
    navigate("/login");
  };

  // Menu navigasi khusus admin
  const navItems = [
    { name: "Dashboard", link: "/admin/dashboard" },
    { name: "Kelola Saham", link: "/admin/datastocks" },
    { name: "Log & Monitoring", link: "/admin/logs" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Resizable Floating Navbar */}
      <ResizableNavbarWrapper
        brand="SokTauSahamAdmin"
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
              Anda akan keluar dari akun admin dan harus login kembali untuk mengakses panel.
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
      <main className="flex-1 overflow-hidden pt-16 md:pt-0 w-full">
        <div className="h-full overflow-y-auto w-full">
          <div className="px-5 sm:px-8 md:px-10 lg:px-12 xl:px-16 py-8 md:py-10 lg:py-12 w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}