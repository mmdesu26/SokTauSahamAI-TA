"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle2, AlertCircle, Info, TriangleAlert } from "lucide-react";

type AlertType = "success" | "error" | "info" | "warning";

type Props = {
  type?: AlertType;
  title?: string;
  message?: string;
  messages?: string[]; // untuk list error
  className?: string;
  dismissible?: boolean;
  autoHideMs?: number; // contoh: 5000
  onDismiss?: () => void;
};

const styles: Record<AlertType, { wrap: string; icon: string }> = {
  success: {
    wrap: "bg-emerald-500/10 border-emerald-500/30 text-emerald-100",
    icon: "text-emerald-400",
  },
  error: {
    wrap: "bg-red-500/10 border-red-500/30 text-red-100",
    icon: "text-red-400",
  },
  info: {
    wrap: "bg-cyan-500/10 border-cyan-500/30 text-cyan-100",
    icon: "text-cyan-400",
  },
  warning: {
    wrap: "bg-amber-500/10 border-amber-500/30 text-amber-100",
    icon: "text-amber-400",
  },
};

function IconByType({ type }: { type: AlertType }) {
  const cls = styles[type].icon;
  if (type === "success") return <CheckCircle2 className={cn("w-5 h-5", cls)} />;
  if (type === "error") return <AlertCircle className={cn("w-5 h-5", cls)} />;
  if (type === "warning") return <TriangleAlert className={cn("w-5 h-5", cls)} />;
  return <Info className={cn("w-5 h-5", cls)} />;
}

export function Alert({
  type = "info",
  title,
  message,
  messages,
  className,
  dismissible = true,
  autoHideMs,
  onDismiss,
}: Props) {
  const [open, setOpen] = React.useState(true);

  React.useEffect(() => {
    if (!autoHideMs) return;
    const t = window.setTimeout(() => {
      setOpen(false);
      onDismiss?.();
    }, autoHideMs);
    return () => window.clearTimeout(t);
  }, [autoHideMs, onDismiss]);

  if (!open) return null;

  const onClose = () => {
    setOpen(false);
    onDismiss?.();
  };

  const list = (messages ?? []).filter(Boolean);

  return (
    <div
      className={cn(
        "w-full rounded-xl border px-5 py-4 flex items-start gap-3",
        styles[type].wrap,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="mt-0.5">
        <IconByType type={type} />
      </div>

      <div className="flex-1">
        {title && <div className="font-semibold text-base">{title}</div>}

        {message && <div className={cn("text-sm mt-1 opacity-90")}>{message}</div>}

        {list.length > 0 && (
          <ul className="mt-2 list-disc pl-5 text-sm opacity-90 space-y-1">
            {list.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        )}
      </div>

      {dismissible && (
        <button
          type="button"
          onClick={onClose}
          className="ml-2 p-1 rounded-md hover:bg-white/5 transition"
          aria-label="Dismiss alert"
        >
          <X className="w-5 h-5 opacity-80" />
        </button>
      )}
    </div>
  );
}
