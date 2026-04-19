// LOGIN ADMIN — pakai accent ADMIN (teal/emerald), bukan investor violet
// Logic & endpoint sama persis dgn versi lama
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Shield, Lock, Eye, EyeOff, User, AlertCircle, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { setAdminSession, isAdminSessionActive } from "@/utils/authSession";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [alert, setAlert] = useState(null); // {type, message}
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "SokTauSaham Admin";
    // kalau session masih aktif, langsung lempar ke dashboard
    if (isAdminSessionActive()) navigate("/admin/dashboard", { replace: true });
  }, [navigate]);

  const onChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setAlert(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    // validasi simpel di client
    if (!form.username.trim() || !form.password.trim()) {
      setAlert({ type: "error", message: "Username dan password wajib diisi." });
      return;
    }

    setLoading(true);
    const { ok, data } = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: form.username, password: form.password }),
    });

    if (ok && data.success) {
      // simpen session admin
      setAdminSession(data.token, data.user, data.expiresInMinutes || 20);
      setAlert({ type: "success", message: "Login berhasil!" });
      setTimeout(() => navigate("/admin/dashboard", { replace: true }), 400);
    } else {
      setAlert({ type: "error", message: data.message || "Username atau password salah." });
    }
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* glow background — pake admin token biar bedain dr investor */}
      <div className="pointer-events-none absolute inset-0 bg-dotted opacity-40" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-admin/20 blur-3xl" />

      {/* theme toggle pojok kanan atas */}
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md animate-fade-up">
        {/* header brand */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-admin shadow-soft">
              <Shield className="h-5 w-5 text-admin-foreground" />
            </div>
            <span className="text-lg font-bold">SokTauSaham Admin</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Masuk ke Panel Admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Kelola data saham, glosarium, prediksi, dan monitoring sistem.
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          {alert && (
            <div className={cn(
              "mb-5 flex items-start gap-2 rounded-xl border p-3 text-sm",
              alert.type === "error"
                ? "border-danger/30 bg-danger/10 text-danger"
                : "border-success/30 bg-success/10 text-success"
            )}>
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{alert.message}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Username</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text" name="username"
                  value={form.username} onChange={onChange}
                  placeholder="admin" className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPwd ? "text" : "password"} name="password"
                  value={form.password} onChange={onChange}
                  placeholder="••••••••" className="pl-9 pr-9"
                />
                <button
                  type="button" onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle password"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* tombol pake variant admin biar warna match */}
            <Button type="submit" variant="admin" size="lg" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : <>Masuk <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
