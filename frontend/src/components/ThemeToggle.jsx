// tombol toggle dark/light — bulet kecil, posisi flex
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      // ukuran fix 40px biar align sama tombol/icon lain
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:border-primary/40 hover:text-primary"
      aria-label="Toggle dark mode"
    >
      {/* icon ganti tergantung tema aktif */}
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
