import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, TrendingUp } from "lucide-react";

import BoxesWrapper from "@/components/BoxesBg";
import ShineForm from "@/components/ShineForm";
import ShineBorderWrapper from "@/components/ShineBorder";
import Button from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppAlert from "@/components/AppAlert";

const DEMO_ACCOUNTS = [
  { email: "investor@example.com" },
  { email: "admin@example.com" },
];

export default function Register() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timer, setTimer] = useState(300);
  const [isResending, setIsResending] = useState(false);
  const [alert, setAlert] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verificationEmail, setVerificationEmail] = useState("");

  useEffect(() => {
    if (step === 2 && timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setAlert(null);
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password.trim() ||
      !formData.confirmPassword.trim()
    ) {
      setAlert({ type: "error", message: "Semua kolom wajib diisi." });
      return;
    }

    if (DEMO_ACCOUNTS.some((acc) => acc.email === formData.email.toLowerCase())) {
      setAlert({ type: "error", message: "Email sudah terdaftar." });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setAlert({ type: "error", message: "Password tidak sama." });
      return;
    }

    setVerificationEmail(formData.email);
    setStep(2);
    setTimer(300);
    setAlert(null);
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    const code = otp.join("");

    if (code.length !== 6) {
      setAlert({ type: "error", message: "Kode verifikasi harus 6 digit." });
      return;
    }

    if (code === "123456") {
      setAlert({ type: "success", message: "Registrasi berhasil! Silakan login." });
      setTimeout(() => navigate("/login"), 1500);
    } else {
      setAlert({ type: "error", message: "Kode verifikasi salah." });
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`register-otp-${index + 1}`)?.focus();
    }
  };

  const handleResendOtp = () => {
    setIsResending(true);
    setTimer(300);

    setTimeout(() => {
      setIsResending(false);
      setAlert({ type: "success", message: "Kode verifikasi telah dikirim ulang." });
    }, 1000);
  };

  return (
    <BoxesWrapper className="flex items-center justify-center px-4">
      <div className="relative w-full max-w-md mx-auto">
        <div className="flex items-center mt-8 gap-2 mb-6 justify-center">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl text-bg-light">SokTauSaham</span>
        </div>

        <ShineBorderWrapper>
          <ShineForm
            title="Daftar Akun Baru"
            description="Buat akun untuk mulai analisis saham dengan AI"
            className="mb-8 bg-primary-dark/60 border border-primary/20 backdrop-blur-sm"
          >
            <div className="text-center text-sm text-bg-light/70 mb-6">
              Step {step} of 2
            </div>

            {alert && (
              <AppAlert
                type={alert.type}
                title={alert.type === "error" ? "Terjadi Kesalahan" : "Berhasil"}
                message={alert.message}
                autoHideMs={6000}
                onDismiss={() => setAlert(null)}
              />
            )}

            {step === 1 && (
              <form onSubmit={handleStep1Submit} className="space-y-5 mt-4">
                <div>
                  <Label className="mb-2 block">Nama Lengkap</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-bg-light/60 pointer-events-none" />
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Nama lengkap"
                      className="pl-10 bg-primary-dark/50 border border-primary/25 text-bg-light"
                    />
                  </div>
                </div>

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

                <div>
                  <Label className="mb-2 block">Konfirmasi Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-bg-light/60 pointer-events-none" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="pl-10 pr-10 bg-primary-dark/50 border border-primary/25 text-bg-light"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-bg-light/70 hover:text-bg-light"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full justify-center mt-2">
                  Registrasi
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleOtpSubmit} className="space-y-6 mt-4">
                <div className="text-center">
                  <p className="text-bg-light/70 mb-2">Kode verifikasi dikirim ke:</p>
                  <p className="text-bg-light font-semibold">{verificationEmail}</p>
                </div>

                <div className="flex justify-center gap-3">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`register-otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      className="w-12 h-12 bg-primary-dark/50 border border-primary/25 text-bg-light text-center rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  ))}
                </div>

                <div className="text-center text-sm text-bg-light/70">
                  Kirim ulang dalam {formatTime(timer)}
                  {timer === 0 && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isResending}
                        className="text-accent hover:text-bg-light disabled:opacity-50"
                      >
                        {isResending ? "Mengirim..." : "Kirim Ulang"}
                      </button>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full justify-center">
                  Verifikasi
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-bg-light/70 mt-8">
              Sudah punya akun?{" "}
              <Link to="/login" className="text-accent hover:text-bg-light">
                Login
              </Link>
            </p>
          </ShineForm>
        </ShineBorderWrapper>
      </div>
    </BoxesWrapper>
  );
}