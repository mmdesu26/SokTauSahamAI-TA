import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, KeyRound } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAppAlert } from "@/components/AppAlertContext";

export default function ChangePassword() {
  const navigate = useNavigate();
  const { showSuccess, showError, showValidationError } = useAppAlert();

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const errors = [];

  if (!formData.oldPassword.trim()) {
    errors.push("Password lama wajib diisi.");
  }
  if (!formData.newPassword.trim()) {
    errors.push("Password baru wajib diisi.");
  }
  if (!formData.confirmPassword.trim()) {
    errors.push("Konfirmasi password wajib diisi.");
  }

  // === VALIDASI BARU (8 karakter + complexity) ===
  const pwd = formData.newPassword.trim();
  if (pwd) {
    if (pwd.length < 8) {
      errors.push("Password baru minimal 8 karakter.");
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push("Password baru harus mengandung minimal 1 huruf besar (A-Z).");
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push("Password baru harus mengandung minimal 1 huruf kecil (a-z).");
    }
    if (!/\d/.test(pwd)) {
      errors.push("Password baru harus mengandung minimal 1 angka (0-9).");
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(pwd)) {
      errors.push("Password baru harus mengandung minimal 1 simbol (!@#$%^&* dll).");
    }
  }

    if (pwd && formData.confirmPassword.trim() && pwd !== formData.confirmPassword.trim()) {
      errors.push("Password baru dan konfirmasi password tidak sama.");
    }

    if (errors.length > 0) {
      showValidationError(errors, "Validasi Gagal");
      return;
    }

    setIsLoading(true);

    const { ok, data } = await apiFetch("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      }),
    });

    if (ok && data.success) {
      resetForm();

      showSuccess(
        data.message ||
          "Password berhasil diubah. Silakan login kembali dengan password baru.",
        "Berhasil"
      );

      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/admin/login", { replace: true });
      }, 1200);
    } else {
      showError(data.message || "Gagal mengubah password.", "Gagal");
    }

    setIsLoading(false);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-16">
      <section className="rounded-3xl border border-[var(--color-admin4)] bg-white p-8 shadow-sm md:p-10">
        <div className="flex items-start gap-4">
          <div>
            <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-800">
              Ubah Password
            </h1>
            <p className="max-w-2xl text-lg text-gray-600">
              Perbarui password admin untuk menjaga keamanan akun dan akses panel administrasi.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-3xl border border-[var(--color-admin4)] bg-white p-7 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-[var(--color-admin)]/15 p-3">
              <KeyRound className="h-5 w-5 text-[var(--color-admin)]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Form Ubah Password
              </h2>
              <p className="text-sm text-gray-600">
                Pastikan password baru mudah diingat namun tetap kuat.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Password Lama
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type={showOldPassword ? "text" : "password"}
                  name="oldPassword"
                  value={formData.oldPassword}
                  onChange={handleChange}
                  placeholder="Masukkan password lama"
                  className="w-full rounded-xl border border-[var(--color-admin4)] bg-white py-3 pl-12 pr-12 text-gray-800 placeholder:text-gray-400 transition focus:border-[var(--color-admin)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin)]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-700"
                >
                  {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Password Baru
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Masukkan password baru"
                  className="w-full rounded-xl border border-[var(--color-admin4)] bg-white py-3 pl-12 pr-12 text-gray-800 placeholder:text-gray-400 transition focus:border-[var(--color-admin)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin)]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Ulangi password baru"
                  className="w-full rounded-xl border border-[var(--color-admin4)] bg-white py-3 pl-12 pr-12 text-gray-800 placeholder:text-gray-400 transition focus:border-[var(--color-admin)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin)]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-[var(--color-admin)] px-5 py-3 font-medium text-white shadow-sm transition hover:bg-[var(--color-admin2)] hover:text-[#222222] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Memproses..." : "Simpan Password Baru"}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-3xl border border-[var(--color-admin4)] bg-white p-7 shadow-sm">
          <h3 className="mb-4 text-xl font-bold text-gray-800">
            Tips Keamanan
          </h3>

          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--color-admin4)] bg-[var(--color-admin3)] p-4">
              <p className="font-medium text-gray-800">
                Gunakan kombinasi yang kuat
              </p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                Sebaiknya gunakan kombinasi huruf besar, huruf kecil, angka, dan simbol agar password lebih aman.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--color-admin4)] bg-[var(--color-admin3)] p-4">
              <p className="font-medium text-gray-800">
                Hindari password lama
              </p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                Jangan gunakan ulang password yang pernah dipakai sebelumnya untuk meminimalkan risiko kebocoran akun.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--color-admin4)] bg-[var(--color-admin3)] p-4">
              <p className="font-medium text-gray-800">
                Login ulang setelah perubahan
              </p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                Setelah password berhasil diubah, sistem akan meminta login ulang menggunakan password baru.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}