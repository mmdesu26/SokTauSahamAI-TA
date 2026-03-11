import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { TrendingUp, Lock, Eye, EyeOff, User } from "lucide-react";
import { apiFetch } from "@/lib/api";

import BoxesWrapper from "@/components/BoxesBg";
import ShineBorderWrapper from "@/components/ShineBorder";
import ShineForm from "@/components/ShineForm";
import Button from "@/components/Button";
import AppAlert from "@/components/AppAlert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
    setAlert({
      type: "error",
      title: "Login Gagal",
      message: errors.join(" "),
    });
    return;
  }

  setIsLoading(true);

  const { ok, data } = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      username: formData.username,
      password: formData.password,
    }),
  });

  if (ok && data.success) {
    localStorage.setItem("token", data.token); // Simpan token untuk autentikasi
    localStorage.setItem("user", JSON.stringify(data.user));

    console.log("Login sukses - User disimpan:", data.user);
    console.log("Login sukses - Token disimpan:", data.token);
    
    setAlert({ type: "success", message: "Login berhasil sebagai admin!" });
    setTimeout(() => navigate("/admin/dashboard"), 1000);
  } else {
    setAlert({
      type: "error",
      title: "Login Gagal",
      message: data.message || "Username atau password salah.",
    });
  }

  setIsLoading(false);
};

  return (
    <BoxesWrapper className="flex items-center justify-center px-4">
      {/* Glow Background */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center mt-8 gap-3 mb-5 justify-center">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-bg-light">SokTauSaham</span>
          </div>

          <h1 className="text-3xl font-bold text-bg-light mb-2">
            Masuk ke Platform
          </h1>
          <p className="text-bg-light/70">
            Analisis saham dengan AI untuk investasi lebih cerdas
          </p>
        </div>

        <ShineBorderWrapper>
          <ShineForm
            title="Login"
            description="Masuk untuk mengakses analisis saham AI"
            className="mb-2 bg-primary-dark/60 border border-primary/20 backdrop-blur-sm"
          >
            {alert && (
              <AppAlert
                type={alert.type}
                title={
                  alert.title ||
                  (alert.type === "error" ? "Terjadi Kesalahan" : "Berhasil")
                }
                message={alert.message}
                autoHideMs={6000}
                onDismiss={() => setAlert(null)}
              />
            )}

            <form onSubmit={handleLogin} className="space-y-5 mt-4">
              {/* Username */}
              <div>
                <Label className="mb-2 block">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-bg-light/60 pointer-events-none" />
                  <Input
                    type="text"
                    name="username"
                    value={formData.username || ""}
                    onChange={handleChange}
                    placeholder="admin"
                    className="pl-10 bg-primary-dark/50 border border-primary/25 text-bg-light"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <Label className="mb-2 block">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-bg-light/60 pointer-events-none" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="pl-10 pr-10 bg-primary-dark/50 border border-primary/25 text-bg-light"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-bg-light/70 hover:text-bg-light"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full justify-center mt-2"
              >
                {isLoading ? "Memproses..." : "Masuk ➜"}
              </Button>
            </form>
          </ShineForm>
        </ShineBorderWrapper>
      </div>
    </BoxesWrapper>
  );
}