// Badge kecil — buat status, label, dll
import { cn } from "@/lib/utils";

const variants = {
  // tone netral
  default: "bg-muted text-muted-foreground",
  // brand investor
  primary: "bg-primary-soft text-primary",
  // brand admin
  admin: "bg-admin-soft text-admin",
  // status naik/turun saham
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  // outline tipis, buat label sekunder
  outline: "border border-border text-foreground",
};

export default function Badge({ variant = "default", className, children, ...props }) {
  return (
    <span
      // pill bulet penuh, ukuran kecil & rapet
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
