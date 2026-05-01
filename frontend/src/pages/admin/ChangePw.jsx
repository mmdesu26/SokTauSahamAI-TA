import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAppAlert } from "@/components/AppAlert";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { clearAdminSession } from "@/utils/authSession";

function PwdField({
  label,
  name,
  show,
  setShow,
  placeholder,
  value,
  onChange,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>

      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={
            name === "oldPassword" ? "current-password" : "new-password"
          }
          className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 pl-9 pr-9 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin focus-visible:border-admin/50"
        />

        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// 🔥 FIX: fungsi lokal clearAuthSession sebelumnya pakai key SALAH
// ("token", "user") → session gak pernah benar-benar ke-clear.
// Dihapus total, sekarang pake clearAdminSession() dari utils
// yang hapus key yang benar (admin_token, admin_user, admin_session_expires_at).

export default function ChangePassword() {
  const navigate = useNavigate();
  const { showSuccess, showError, showValidationError } = useAppAlert();

  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const reset = () =>
    setForm({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

  const onSubmit = async (e) => {
    e.preventDefault();

    const errors = [];
    const oldPassword = form.oldPassword.trim();
    const newPassword = form.newPassword.trim();
    const confirmPassword = form.confirmPassword.trim();

    if (!oldPassword) errors.push("Password lama wajib diisi.");
    if (!newPassword) errors.push("Password baru wajib diisi.");
    if (!confirmPassword) errors.push("Konfirmasi password wajib diisi.");

    if (newPassword) {
      if (newPassword.length < 8) errors.push("Password baru minimal 8 karakter.");
      if (!/[A-Z]/.test(newPassword)) errors.push("Harus ada minimal 1 huruf besar.");
      if (!/[a-z]/.test(newPassword)) errors.push("Harus ada minimal 1 huruf kecil.");
      if (!/\d/.test(newPassword)) errors.push("Harus ada minimal 1 angka.");
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(newPassword)) {
        errors.push("Harus ada minimal 1 simbol.");
      }
    }

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      errors.push("Password baru dan konfirmasi tidak sama.");
    }

    if (errors.length) {
      showValidationError(errors);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      };

      const { ok, data } = await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (ok && data?.success) {
        // ⚠️ URUTAN PENTING — bug sebelumnya: session gak ke-clear
        // (key salah) → navigate ke /admin/login → login page auto-redirect
        // balik ke /admin/dashboard → dashboard fetch data pakai token lama
        // yang token_version-nya udah beda di backend → dapat 401
        // "Token tidak valid" → toast error timpa toast success → lama.
        //
        // Sekarang:
        // 1. Clear session DULU (biar gak ada token lagi di sessionStorage)
        // 2. Reset form
        // 3. Tampilin toast success
        // 4. Navigate — useEffect di Login.jsx sekarang gak nemu session aktif
        //    jadi gak redirect balik. Juga gak ada komponen admin lain yg
        //    sempet fetch pakai token basi.

        clearAdminSession();
        reset();

        showSuccess(
          "Password berhasil diubah. Silakan login ulang dengan password baru.",
          "Berhasil"
        );

        // kasih jeda sangat singkat biar state update selesai dulu
        // (clearAdminSession sync, tapi navigate transition lebih smooth)
        setTimeout(() => {
          navigate("/admin/login", { replace: true });
        }, 50);
      } else {
        // backend tolak — misal password lama salah, validasi server, dsb
        showError(data?.message || "Gagal mengubah password.", "Gagal");
      }
    } catch (error) {
      showError("Terjadi kesalahan saat mengubah password.", "Gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <Badge variant="admin" className="mb-2">
          <KeyRound className="h-3 w-3" /> Akun
        </Badge>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Ubah Password
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Perbarui password buat jaga keamanan akun admin.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-admin-soft text-admin">
              <KeyRound className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-semibold">Form Ubah Password</h2>
              <p className="text-xs text-muted-foreground">
                Pastiin password baru kuat tapi gampang diingat.
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <PwdField
              label="Password Lama"
              name="oldPassword"
              show={showOld}
              setShow={setShowOld}
              placeholder="Password lama"
              value={form.oldPassword}
              onChange={onChange}
            />

            <PwdField
              label="Password Baru"
              name="newPassword"
              show={showNew}
              setShow={setShowNew}
              placeholder="Password baru"
              value={form.newPassword}
              onChange={onChange}
            />

            <PwdField
              label="Konfirmasi Password Baru"
              name="confirmPassword"
              show={showConf}
              setShow={setShowConf}
              placeholder="Ulangi password baru"
              value={form.confirmPassword}
              onChange={onChange}
            />

            <Button
              type="submit"
              variant="admin"
              size="lg"
              className="mt-2 w-full"
              disabled={loading}
            >
              {loading ? "Memproses..." : "Simpan Password Baru"}
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-admin" />
            <h3 className="text-base font-semibold">Tips Keamanan</h3>
          </div>

          <div className="space-y-3 text-sm">
            {[
              ["Kombinasi kuat", "Pakai huruf besar, kecil, angka, dan simbol."],
              ["Hindari password lama", "Jangan pakai ulang password yg pernah dipake."],
              ["Minimal 8 karakter", "Lebih panjang = lebih susah di-brute force."],
            ].map(([title, desc]) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-muted/40 p-3"
              >
                <p className="font-medium">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}