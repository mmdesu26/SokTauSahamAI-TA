import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Navbar,
  NavBody,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavbarButton,
} from "@/components/ui/resizable-navbar";

import { TrendingUp, LogOut } from "lucide-react";

export default function ResizableNavbarWrapper({
  brand = "SokTauSaham",
  items = defaultItems,
  onLogout,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);

  const closeMobile = () => setIsOpen(false);

  return (
    <Navbar className={className}>
      {/* DESKTOP */}
      <NavBody className={cn("dark:bg-transparent", "min-w-[800px]")}>
        <Brand brand={brand} />

        <DesktopNavLinks items={items} />

        <div className="relative z-20 flex items-center gap-2">
          {onLogout ? (
            <NavbarButton
              as="button"
              type="button"
              variant="secondary"
              onClick={onLogout}
              className="flex items-center gap-2 !text-red-500 hover:!text-red-600 dark:!text-red-400 dark:hover:!text-red-300"
            >
              <LogOut className="h-4 w-4" />
              Kembali ke Beranda
            </NavbarButton>
          ) : null}
        </div>
      </NavBody>

      {/* MOBILE */}
      <MobileNav className="dark:bg-transparent">
        <MobileNavHeader>
          <Brand brand={brand} compact />
          <MobileNavToggle
            isOpen={isOpen}
            onClick={() => setIsOpen((v) => !v)}
          />
        </MobileNavHeader>

        <MobileNavMenu isOpen={isOpen} onClose={closeMobile}>
          {items.map((it) => (
            <NavLink
              key={it.link}
              to={it.link}
              onClick={() => closeMobile()}
              className={({ isActive }) =>
                cn(
                  "w-full rounded-md px-3 py-2 text-sm font-medium transition",
                  // warna menu sebelum aktif
                  "text-primary-dark hover:bg-bg-light/40 dark:text-bg-light dark:hover:bg-primary/20",
                  // warna menu saat aktif
                  isActive &&
                    "bg-accent/15 text-accent dark:bg-accent/10 dark:text-accent"
                )
              }
            >
              {it.name}
            </NavLink>
          ))}

          {onLogout ? (
            <>
              <div className="my-2 h-px w-full bg-primary-dark/15 dark:bg-bg-light/15" />
              <button
                type="button"
                onClick={() => {
                  closeMobile();
                  onLogout();
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : null}
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}

function Brand({ brand, compact = false }) {
  return (
    <NavLink
      to="/investor/dashboard"
      className="relative z-20 mr-2 flex items-center space-x-2 px-2 py-1"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <TrendingUp className="h-5 w-5 text-white" />
      </div>

      {!compact && (
        <span className="font-semibold text-primary-dark dark:text-bg-light">
          {brand}
        </span>
      )}
    </NavLink>
  );
}

/**
 * Desktop nav links:
 * UI NavItems bawaan pakai <a href>, jadi wrapper bikin versi NavLink supaya SPA.
 * Layout tetap center seperti NavItems (absolute inset-0 center).
 */
function DesktopNavLinks({ items }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium transition duration-200 lg:flex lg:space-x-2",
        "text-primary-dark/80 hover:text-primary-dark dark:text-bg-light/80 dark:hover:text-bg-light"
      )}
    >
      {items.map((item, idx) => (
        <NavLink
          key={`link-${idx}`}
          to={item.link}
          onMouseEnter={() => setHovered(idx)}
          className={({ isActive }) =>
            cn(
              "relative rounded-full px-4 py-2 transition",
              // warna sebelum aktif
              "text-primary-dark/80 hover:text-primary-dark dark:text-bg-light/80 dark:hover:text-bg-light",
              // warna saat aktif
              isActive && "text-accent dark:text-accent font-semibold"
            )
          }
        >
          {hovered === idx && (
            <div className="absolute inset-0 h-full w-full rounded-full bg-bg-light/50 dark:bg-primary/25" />
          )}
          <span className="relative z-20">{item.name}</span>
        </NavLink>
      ))}
    </div>
  );
}

const defaultItems = [
  { name: "Dashboard", link: "/investor/dashboard" },
  { name: "Cari Saham", link: "/investor/stocks" },
  { name: "Glosarium", link: "/investor/glossary" },
];