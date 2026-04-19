// Button reusable — variants konsisten, ukuran identik
// dipakai di seluruh app biar tombol seragam
import { cn } from "@/lib/utils";

const variants = {
  // primary = aksen utama (investor pake violet)
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft",
  // admin variant — emerald/teal
  admin:
    "bg-admin text-admin-foreground hover:bg-admin/90 shadow-soft",
  // outline = border tipis, transparan
  outline:
    "border border-border bg-transparent text-foreground hover:bg-muted hover:border-primary/40",
  // ghost = full transparan, cuma hover state
  ghost: "bg-transparent text-foreground hover:bg-muted",
  // destructive — buat aksi delete dll
  destructive: "bg-danger text-white hover:bg-danger/90",
  // gradient — buat CTA hero biar wow tapi tetep clean
  gradient:
    "bg-gradient-primary text-primary-foreground hover:opacity-95 shadow-lift",
};

const sizes = {
  // ukuran fix biar tombol semua sama, gak ada yg gede sendiri
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2", // default — paling banyak dipake
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-10 w-10 p-0", // tombol icon-only
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}) {
  return (
    <button
      // base style + variant + size, di-merge biar bisa di-override class custom
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
