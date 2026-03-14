import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import ResizableNavbarWrapper from "@/components/ResizableNavbar";
import BoxesWrapper from "@/components/BoxesBg";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => setShowLogoutModal(true);

  const handleConfirmLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  setShowLogoutModal(false);
  navigate("/admin/login");
};

  const navItems = [
    { name: "Dashboard", link: "/admin/dashboard" },
    { name: "Kelola Saham", link: "/admin/datastocks" },
    { name: "Kelola Glosarium", link: "/admin/glossary" },
    { name: "Log & Monitoring", link: "/admin/logs" },
    { name: "Ubah Password", link: "/admin/changepassword" },
  ];

  return (
    <BoxesWrapper className="min-h-screen w-full bg-[var(--color-admin3)]">
      <div className="fixed top-0 left-0 z-50 w-full">
        <ResizableNavbarWrapper
          brand="SokTauSahamAdmin"
          items={navItems}
          onLogout={handleLogoutClick}
          className="dark"
        />
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--color-admin4)] bg-[var(--color-admin3)] p-7 shadow-xl">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                <AlertCircle className="h-7 w-7 text-red-500" />
              </div>

              <h3 className="text-xl font-semibold text-[#222222]">
                Yakin ingin keluar?
              </h3>
            </div>

            <p className="mb-8 leading-relaxed text-[#555555]">
              Anda akan keluar dari akun admin dan harus login kembali untuk
              mengakses panel.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 rounded-xl border border-[var(--color-admin4)] bg-white px-5 py-3 font-medium text-[#222222] transition hover:bg-[var(--color-admin3)]"
              >
                Batal
              </button>

              <button
                onClick={handleConfirmLogout}
                className="flex-1 rounded-xl bg-[var(--color-admin)] px-5 py-3 font-medium text-white transition hover:bg-[var(--color-admin2)] hover:text-[#222222]"
              >
                Ya, Logout
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