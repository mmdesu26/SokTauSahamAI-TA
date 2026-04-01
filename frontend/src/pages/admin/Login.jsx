import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { TrendingUp, Lock, Eye, EyeOff, User } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { setAdminSession, isAdminSessionActive } from "@/utils/authSession";

import BoxesWrapper from "@/components/BoxesBg";
import ShineBorderWrapper from "@/components/ShineBorder";
import ShineForm from "@/components/ShineForm";
import Button from "@/components/Button";
import AppAlert from "@/components/AppAlert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = "SokTauSaham Admin";
    if (isAdminSessionActive()) navigate("/admin/dashboard", { replace: true });
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setAlert(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAlert(null);

    const errors = [];
    if (!formData.username.trim()) errors.push("Username wajib diisi.");
    if (!formData.password.trim()) errors.push("Password wajib diisi.");

    if (errors.length) {
      setAlert({ type: "error", title: "Login Gagal", message: errors.join(" ") });
      return;
    }

    setIsLoading(true);
    const { ok, data } = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: formData.username, password: formData.password }),
    });

    if (ok && data.success) {
      setAdminSession(data.token, data.user, data.expiresInMinutes || 20);
      setAlert({ type: "success", message: "Login berhasil sebagai admin!" });
      setTimeout(() => navigate("/admin/dashboard", { replace: true }), 500);
    } else {
      setAlert({ type: "error", title: "Login Gagal", message: data.message || "Username atau password salah." });
    }

    setIsLoading(false);
  };

  return (
    <BoxesWrapper className="flex items-center justify-center px-4">
      <div className="absolute top-20 right-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute bottom-20 left-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mt-8 mb-5 inline-flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-bg-light">SokTauSaham Admin</span>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-bg-light">Masuk ke Panel Admin</h1>
          <p className="text-bg-light/70">Kelola data saham, glosarium, prediksi, dan monitoring sistem</p>
        </div>

        <ShineBorderWrapper>
          <ShineForm title="Login Admin" description="Masuk untuk mengakses panel admin SokTauSaham" className="mb-2 border border-primary/20 bg-primary-dark/60 backdrop-blur-sm">
            {alert && (
              <AppAlert type={alert.type} title={alert.title || (alert.type === "error" ? "Terjadi Kesalahan" : "Berhasil")} message={alert.message} autoHideMs={6000} onDismiss={() => setAlert(null)} />
            )}

            <form onSubmit={handleLogin} className="mt-4 space-y-5">
              <div>
                <Label className="mb-2 block">Username</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-bg-light/60" />
                  <Input type="text" name="username" value={formData.username || ""} onChange={handleChange} placeholder="admin" className="border border-primary/25 bg-primary-dark/50 pl-10 text-bg-light" />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-bg-light/60" />
                  <Input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="border border-primary/25 bg-primary-dark/50 pl-10 pr-10 text-bg-light" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 right-3 -translate-y-1/2 text-bg-light/70 hover:text-bg-light">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="mt-2 w-full justify-center">
                {isLoading ? "Memproses..." : "Masuk ➜"}
              </Button>
            </form>
          </ShineForm>
        </ShineBorderWrapper>
      </div>
    </BoxesWrapper>
  );
}
