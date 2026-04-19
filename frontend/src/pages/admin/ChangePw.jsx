// CHANGE PASSWORD — logic & validasi sama persis dgn versi lama
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAppAlert } from "@/components/AppAlert";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

export default function ChangePassword() {
  const navigate = useNavigate();
  const { showSuccess, showError, showValidationError } = useAppAlert();

  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const reset = () => setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });

  // validasi password baru — minimal 8 char + complexity
  const onSubmit = async (e) => {
    e.preventDefault();
    const errors = [];
    if (!form.oldPassword.trim()) errors.push("Password lama wajib diisi.");
    if (!form.newPassword.trim()) errors.push("Password baru wajib diisi.");
    if (!form.confirmPassword.trim()) errors.push("Konfirmasi password wajib diisi.");

    const pwd = form.newPassword.trim();
    if (pwd) {
      if (pwd.length < 8) errors.push("Password baru minimal 8 karakter.");
      if (!/[A-Z]/.test(pwd)) errors.push("Harus ada minimal 1 huruf besar.");
      if (!/[a-z]/.test(pwd)) errors.push("Harus ada minimal 1 huruf kecil.");
      if (!/\d/.test(pwd)) errors.push("Harus ada minimal 1 angka.");
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(pwd)) errors.push("Harus ada minimal 1 simbol.");
    }
    if (pwd && form.confirmPassword.trim() && pwd !== form.confirmPassword.trim()) {
      errors.push("Password baru dan konfirmasi tidak sama.");
    }

    if (errors.length) { showValidationError(errors); return; }

    setLoading(true);
    const { ok, data } = await apiFetch("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(form),
    });

    if (ok && data.success) {
      reset();
      showSuccess(data.message || "Password berhasil diubah. Silakan login ulang.", "Berhasil");
      setTimeout(() => navigate("/admin/login", { replace: true }), 1200);
    } else {
      showError(data.message || "Gagal mengubah password.", "Gagal");
    }
    setLoading(false);
  };

  // helper render input password — biar gak duplikat
  const PwdField = ({ label, name, show, setShow, placeholder }) => (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type={show ? "text" : "password"}
          name={name} value={form[name]} onChange={onChange}
          placeholder={placeholder}
          className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 pl-9 pr-9 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin focus-visible:border-admin/50"
        />
        <button
          type="button" onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <header>
        <Badge variant="admin" className="mb-2"><KeyRound className="h-3 w-3" /> Akun</Badge>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Ubah Password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Perbarui password buat jaga keamanan akun admin.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        {/* form utama */}
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-admin-soft text-admin">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Form Ubah Password</h2>
              <p className="text-xs text-muted-foreground">Pastiin password baru kuat tapi gampang diingat.</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <PwdField label="Password Lama" name="oldPassword" show={showOld} setShow={setShowOld} placeholder="Password lama" />
            <PwdField label="Password Baru" name="newPassword" show={showNew} setShow={setShowNew} placeholder="Password baru" />
            <PwdField label="Konfirmasi Password Baru" name="confirmPassword" show={showConf} setShow={setShowConf} placeholder="Ulangi password baru" />

            <Button type="submit" variant="admin" size="lg" className="mt-2 w-full" disabled={loading}>
              {loading ? "Memproses..." : "Simpan Password Baru"}
            </Button>
          </form>
        </Card>

        {/* tips keamanan */}
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
            ].map(([t, d]) => (
              <div key={t} className="rounded-xl border border-border bg-muted/40 p-3">
                <p className="font-medium">{t}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
