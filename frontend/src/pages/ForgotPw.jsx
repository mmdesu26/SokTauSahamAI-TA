import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, TrendingUp, Eye, EyeOff } from "lucide-react";

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

const TOTAL_STEPS = 3;

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [timer, setTimer] = useState(300);
  const [isResending, setIsResending] = useState(false);
  const [alert, setAlert] = useState(null);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    if (step === 2 && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setAlert(null);

    if (!email.trim()) {
      setAlert({ type: "error", message: "Email wajib diisi." });
      return;
    }

    if (!DEMO_ACCOUNTS.some((acc) => acc.email === email.toLowerCase())) {
      setAlert({ type: "error", message: "Email belum terdaftar." });
      return;
    }

    setResetEmail(email);
    setStep(2);
    setTimer(300);
  };

  const handleOtpChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
    setAlert(null);

    if (otp.join("").length !== 6) {
      setAlert({ type: "error", message: "Kode verifikasi harus 6 digit." });
      return;
    }

    if (otp.join("") !== "123456") {
      setAlert({ type: "error", message: "Kode verifikasi salah." });
      return;
    }

    setStep(3);
  };

  const handleResendOtp = () => {
    setIsResending(true);
    setTimer(300);

    setTimeout(() => {
      setIsResending(false);
      setAlert({
        type: "success",
        message: "Kode verifikasi telah dikirim ulang.",
      });
    }, 1000);
  };

  const handleStep3Submit = (e) => {
    e.preventDefault();
    setAlert(null);

    if (!newPassword || !confirmPassword) {
      setAlert({ type: "error", message: "Semua kolom wajib diisi." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setAlert({ type: "error", message: "Password tidak sama." });
      return;
    }

    setAlert({
      type: "success",
      message: "Password berhasil direset. Silakan login.",
    });

    setTimeout(() => navigate("/login"), 1500);
  };

  return (
    <BoxesWrapper className="flex items-center justify-center px-4">
      <div className="relative w-full max-w-md mx-auto">
          <div className="text-center mb-3"> 
          <div className="inline-flex items-center mt-8 gap-3 mb-5 justify-center">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl text-bg-light">SokTauSaham</span>
        </div>
        </div>

        <ShineBorderWrapper>
          <ShineForm
            title="Lupa Password"
            description="Reset password akun Anda"
            className="bg-primary-dark/60 border border-primary/20 backdrop-blur-sm"
          >
            <div className="text-center text-sm text-bg-light/70 mb-6">
              Step {step} of {TOTAL_STEPS}
            </div>

            {alert && (
              <AppAlert
                type={alert.type}
                title={alert.type === "error" ? "Terjadi Kesalahan" : "Sukses"}
                message={alert.message}
                autoHideMs={6000}
                onDismiss={() => setAlert(null)}
              />
            )}

            {step === 1 && (
              <form onSubmit={handleStep1Submit} className="space-y-6 mt-4">
                <div>
                  <Label className="mb-2 block">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-bg-light/60 pointer-events-none" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="investor@example.com"
                      className="pl-10 bg-primary-dark/50 border border-primary/25 text-bg-light"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full justify-center">
                  Kirim Kode
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleStep2Submit} className="space-y-6 mt-4">
                <div className="text-center">
                  <p className="text-bg-light/70 mb-2">
                    Masukkan kode verifikasi yang dikirim ke:
                  </p>
                  <p className="text-bg-light font-semibold">{resetEmail}</p>
                </div>

                <div className="flex justify-center gap-2">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
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

            {step === 3 && (
              <form onSubmit={handleStep3Submit} className="space-y-6 mt-4">
                <div>
                  <Label className="mb-2 block">Password Baru</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-bg-light/60 pointer-events-none" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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

                <Button type="submit" className="w-full justify-center">
                  Reset Password
                </Button>
              </form>
            )}

            <div className="text-center mt-6">
              <Link to="/login" className="text-bg-light/70 hover:text-bg-light text-sm">
                ← Kembali ke Login
              </Link>
            </div>
          </ShineForm>
        </ShineBorderWrapper>
      </div>
    </BoxesWrapper>
  );
}