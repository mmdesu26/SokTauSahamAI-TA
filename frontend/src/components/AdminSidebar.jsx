// Sidebar admin — vertical, fixed di kiri (desktop), drawer di mobile
// pakai accent token --color-admin biar kerasa "ini area internal"
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Database, BookOpen, Activity, KeyRound, LogOut, Menu, X, Shield,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import Button from "./ui/Button";
import { cn } from "@/lib/utils";
import { clearAdminSession } from "@/utils/authSession";
import { apiFetch } from "@/lib/api";

// daftar menu admin — icon konsisten dr lucide
const menu = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/datastocks", label: "Kelola Saham", icon: Database },
  { to: "/admin/glossary", label: "Glosarium", icon: BookOpen },
  { to: "/admin/logs", label: "Log & Monitoring", icon: Activity },
  { to: "/admin/changepassword", label: "Ubah Password", icon: KeyRound },
];

export default function AdminSidebar() {
  const [open, setOpen] = useState(false); // mobile drawer toggle
  const navigate = useNavigate();

  // logout — hit api & clear session
  const handleLogout = async () => {
    try { await apiFetch("/auth/logout", { method: "POST" }); } catch {}
    clearAdminSession();
    navigate("/admin/login", { replace: true });
  };

  // konten sidebar — dipake di dua tempat (desktop & mobile drawer)
  const Inner = (
    <div className="flex h-full flex-col">
      {/* brand admin */}
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-admin shadow-soft">
          <Shield className="h-5 w-5 text-admin-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight">SokTauSaham</p>
          <p className="text-xs text-admin">Admin Panel</p>
        </div>
      </div>

      {/* nav menu — flex-1 biar bottom selalu nempel bawah */}
      <nav className="flex-1 space-y-1 px-3">
        {menu.map((m) => {
          const Icon = m.icon;
          return (
            <NavLink
              key={m.to}
              to={m.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  // ukuran row identik biar rapi
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-admin-soft text-admin"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {m.label}
            </NavLink>
          );
        })}
      </nav>

      {/* footer sidebar — theme + logout */}
      <div className="space-y-2 border-t border-border p-3">
        <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2">
          <span className="text-xs text-muted-foreground">Tema</span>
          <ThemeToggle />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-danger hover:bg-danger/10 hover:border-danger/40 hover:text-danger"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* topbar mobile — cuma muncul di HP */}
      <div className="sticky top-0 z-40 flex h-14 items-center border-b border-border bg-background px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            aria-label="Buka sidebar admin"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card transition hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-admin">
              <Shield className="h-4 w-4 text-admin-foreground" />
            </div>
            <span className="text-sm font-bold">Admin Panel</span>
          </Link>
        </div>
      </div>

      {/* sidebar desktop — fixed kiri */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-card lg:block">
        {Inner}
      </aside>

      {/* drawer mobile — overlay penuh */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-card shadow-lift">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border"
            >
              <X className="h-5 w-5" />
            </button>
            {Inner}
          </aside>
        </div>
      )}
    </>
  );
}
