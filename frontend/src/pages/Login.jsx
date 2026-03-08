import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { TrendingUp, Mail, Lock, Eye, EyeOff } from "lucide-react";

import BoxesWrapper from "@/components/BoxesBg";
import ShineBorderWrapper from "@/components/ShineBorder";
import ShineForm from "@/components/ShineForm";
import Button from "@/components/Button";
import AppAlert from "@/components/AppAlert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEMO_ACCOUNTS = [
  {
    email: "investor@example.com",
    password: "investor123",
    role: "user",
    name: "Investor User",
  },
  {
    email: "admin@example.com",
    password: "admin123",
    role: "admin",
    name: "Administrator",
  },
];

export default function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setAlert(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAlert(null);

    const errors = [];
    if (!formData.email.trim()) errors.push("Email wajib diisi.");
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

    await new Promise((resolve) => setTimeout(resolve, 500));

    const account = DEMO_ACCOUNTS.find(
      (acc) =>
        acc.email === formData.email.trim() && acc.password === formData.password
    );

    if (account) {
      localStorage.setItem("user", JSON.stringify(account));
      setAlert({
        type: "success",
        title: "Berhasil",
        message: `Login berhasil sebagai ${
          account.role === "admin" ? "Admin" : "User"
        }.`,
      });

      setTimeout(() => {
        account.role === "admin"
          ? navigate("/admin/dashboard")
          : navigate("/investor/dashboard");
      }, 600);
    } else {
      setAlert({
        type: "error",
        title: "Login Gagal",
        message: "Email atau password salah.",
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
              {/* Email */}
              <div>
                <Label className="mb-2 block">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-bg-light/60 pointer-events-none" />
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="investor@example.com"
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

              {/* Links */}
              <div className="flex justify-between text-sm">
                <Link
                  to="/register"
                  className="text-bg-light/70 hover:text-bg-light"
                >
                  Belum punya akun?
                </Link>
                <Link
                  to="/forgot-password"
                  className="text-bg-light/70 hover:text-bg-light"
                >
                  Lupa password?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full justify-center mt-2"
              >
                {isLoading ? "Memproses..." : "Masuk ➜"}
              </Button>
            </form>

            {/* Demo Accounts */}
            <button
              type="button"
              onClick={() => setShowDemo((s) => !s)}
              className="w-full mt-6 text-sm text-accent hover:text-bg-light text-center"
            >
              {showDemo ? "Sembunyikan" : "Tampilkan"} Akun Demo
            </button>

            {showDemo && (
              <div className="mt-6 space-y-4 border-t border-primary/20 pt-6">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      email: "investor@example.com",
                      password: "investor123",
                    })
                  }
                  className="w-full text-left bg-primary-dark/40 p-4 rounded-lg hover:bg-primary-dark/55 transition border border-primary/15"
                >
                  <p className="text-xs text-bg-light/70 mb-2 font-semibold">
                    📊 Akun Investor
                  </p>
                  <p className="text-xs text-accent font-mono">
                    investor@example.com <br />
                    investor123
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      email: "admin@example.com",
                      password: "admin123",
                    })
                  }
                  className="w-full text-left bg-primary-dark/40 p-4 rounded-lg hover:bg-primary-dark/55 transition border border-primary/15"
                >
                  <p className="text-xs text-bg-light/70 mb-2 font-semibold">
                    ⚙️ Akun Admin
                  </p>
                  <p className="text-xs text-accent font-mono">
                    admin@example.com <br />
                    admin123
                  </p>
                </button>
              </div>
            )}
          </ShineForm>
        </ShineBorderWrapper>

        <div className="text-center mt-3 mb-8">
          <Link to="/" className="text-bg-light/70 hover:text-bg-light text-sm">
            ← Kembali ke beranda
          </Link>
        </div>
      </div>
    </BoxesWrapper>
  );
}