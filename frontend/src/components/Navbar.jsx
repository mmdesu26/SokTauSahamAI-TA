// Navbar buat investor — sticky, glass effect, responsive (hamburger di HP)
import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, TrendingUp } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import Button from "./ui/Button";
import { cn } from "@/lib/utils";

export default function Navbar({ items = [] }) {
  const [open, setOpen] = useState(false);     // state hamburger menu (mobile)
  const [scrolled, setScrolled] = useState(false); // efek shadow saat di-scroll

  useEffect(() => {
    // detect scroll buat kasih shadow + bg lebih solid
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        // sticky di top, blur supaya kena vibe glass
        "fixed top-0 left-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-xl"
          : "bg-background/40 backdrop-blur-md"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* logo brand kiri */}
        <Link to="/" className="flex items-center gap-2">
          {/* icon brand pake gradient — biar kerasa premium */}
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-soft">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-base font-bold tracking-tight">SokTauSaham</span>
        </Link>

        {/* nav link tengah — desktop only */}
        <nav className="hidden items-center gap-1 md:flex">
          {items.map((it) => (
            <NavLink
              key={it.link}
              to={it.link}
              className={({ isActive }) =>
                cn(
                  // ukuran fix biar align rapi
                  "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-soft text-primary" // active state pake bg lembut
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )
              }
            >
              {it.name}
            </NavLink>
          ))}
        </nav>

        {/* action kanan — theme + admin link */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {/* hamburger mobile */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border md:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* mobile drawer — slide down */}
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
            {items.map((it) => (
              <NavLink
                key={it.link}
                to={it.link}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-soft text-primary"
                      : "text-foreground hover:bg-muted"
                  )
                }
              >
                {it.name}
              </NavLink>
            ))}
            <Link to="/admin/login" onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm" className="mt-2 w-full">
                Login Admin
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
