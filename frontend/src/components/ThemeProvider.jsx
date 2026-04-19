// ThemeProvider — ngatur dark/light mode pakai class di <html>
// nyimpen pilihan user di localStorage biar gak reset tiap reload
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
  toggle: () => {},
});

export function ThemeProvider({ children, defaultTheme = "light" }) {
  const [theme, setTheme] = useState(() => {
    // ambil dari localStorage dulu, fallback ke default / sistem
    if (typeof window === "undefined") return defaultTheme;
    const saved = localStorage.getItem("sts-theme");
    if (saved) return saved;
    // ngikutin OS user kalau belum pernah set
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : defaultTheme;
  });

  useEffect(() => {
    // toggle class .dark di <html> setiap theme berubah
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("sts-theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

// hook biar gampang dipake di komponen
export const useTheme = () => useContext(ThemeContext);
