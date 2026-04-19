// AppAlert — context buat nampilin toast/notif sederhana
// Dipake di admin pages, ekspor method showSuccess/showError/showValidationError
// biar kompatibel sama logic admin lama
import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

const AppAlertContext = createContext({
  show: () => {},
  showSuccess: () => {},
  showError: () => {},
  showValidationError: () => {},
});

const tones = {
  success: { icon: CheckCircle2, cls: "border-success/30 bg-success/10" },
  error:   { icon: AlertCircle,  cls: "border-danger/30 bg-danger/10" },
  warning: { icon: AlertCircle,  cls: "border-warning/30 bg-warning/10" },
  info:    { icon: Info,         cls: "border-info/30 bg-info/10" },
};

export function AppAlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);

  // core fn — push alert ke state, auto-remove setelah X ms
  const show = useCallback((message, type = "info", title, duration = 4000) => {
    const id = Date.now() + Math.random();
    setAlerts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, duration);
  }, []);

  // helper2 biar gampang dipake di admin lama
  const showSuccess = useCallback((msg, title) => show(msg, "success", title), [show]);
  const showError   = useCallback((msg, title) => show(msg, "error", title), [show]);
  const showValidationError = useCallback((errors, title = "Validasi Gagal") => {
    // errors bisa array string → join jadi 1 message
    const msg = Array.isArray(errors) ? errors.join(" ") : errors;
    show(msg, "error", title, 6000);
  }, [show]);

  const dismiss = (id) => setAlerts((prev) => prev.filter((a) => a.id !== id));

  return (
    <AppAlertContext.Provider value={{ show, showSuccess, showError, showValidationError }}>
      {children}
      {/* container fixed pojok kanan atas */}
      <div className="pointer-events-none fixed top-4 right-4 z-[200] flex w-full max-w-sm flex-col gap-2">
        {alerts.map((a) => {
          const tone = tones[a.type] || tones.info;
          const Icon = tone.icon;
          return (
            <div
              key={a.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-xl border bg-card p-4 shadow-card animate-fade-up",
                tone.cls
              )}
            >
              <Icon className={cn(
                "h-5 w-5 shrink-0",
                a.type === "success" && "text-success",
                a.type === "error" && "text-danger",
                a.type === "warning" && "text-warning",
                a.type === "info" && "text-info",
              )} />
              <div className="flex-1">
                {a.title && <p className="text-sm font-semibold text-foreground">{a.title}</p>}
                <p className="text-sm text-muted-foreground">{a.message}</p>
              </div>
              <button
                onClick={() => dismiss(a.id)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </AppAlertContext.Provider>
  );
}

export const useAppAlert = () => useContext(AppAlertContext);
