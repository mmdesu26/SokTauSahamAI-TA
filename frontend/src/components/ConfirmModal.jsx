// Modal konfirmasi reusable — buat logout, delete, dll
import { AlertCircle } from "lucide-react";
import Button from "./ui/Button";

export default function ConfirmModal({
  open,
  title = "Konfirmasi",
  description = "Apakah kamu yakin?",
  confirmText = "Ya, lanjut",
  cancelText = "Batal",
  tone = "primary", // bisa primary / destructive
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    // backdrop overlay — full screen gelap
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 px-4 backdrop-blur-sm animate-fade-up">
      {/* card modal */}
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lift">
        <div className="mb-4 flex items-center gap-3">
          {/* icon warna ngikutin tone */}
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            tone === "destructive" ? "bg-danger/10 text-danger" : "bg-primary-soft text-primary"
          }`}>
            <AlertCircle className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>

        <div className="flex gap-3">
          {/* tombol cancel selalu outline */}
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            variant={tone === "destructive" ? "destructive" : "primary"}
            className="flex-1"
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
