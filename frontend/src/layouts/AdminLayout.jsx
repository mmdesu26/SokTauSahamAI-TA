// Layout admin — sidebar kiri + content kanan, full responsive
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/AdminSidebar";
import { AppAlertProvider } from "@/components/AppAlert";
import useAdminAutoLogout from "@/hooks/useAdminAutoLogout";

export default function AdminLayout() {
  // auto-logout hook — jaga security
  useAdminAutoLogout();

  useEffect(() => {
    document.title = "SokTauSaham Admin";
  }, []);

  return (
    <AppAlertProvider>
      <div className="min-h-screen bg-muted/30 text-foreground">
        <AdminSidebar />

        {/* content area — geser ke kanan 64 (lebar sidebar) di desktop */}
        <main className="lg:pl-64">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </AppAlertProvider>
  );
}
