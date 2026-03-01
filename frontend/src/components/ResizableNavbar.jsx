import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
              className="flex items-center gap-2 text-red-400 hover:text-red-300"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
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
                  "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800",
                  isActive && "bg-cyan-500/15 text-cyan-400 dark:bg-cyan-500/10"
                )
              }
            >
              {it.name}
            </NavLink>
          ))}

          {onLogout ? (
            <>
              <div className="h-px w-full bg-neutral-200 dark:bg-neutral-800 my-2" />
              <button
                type="button"
                onClick={() => {
                  closeMobile();
                  onLogout();
                }}
                className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 transition"
              >
                <LogOut className="w-4 h-4" />
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
      <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
        <TrendingUp className="w-5 h-5 text-white" />
      </div>
      {!compact && (
        <span className="font-semibold text-black dark:text-white">
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
        "text-zinc-600 hover:text-zinc-800"
      )}
    >
      {items.map((item, idx) => (
        <NavLink
          key={`link-${idx}`}
          to={item.link}
          onMouseEnter={() => setHovered(idx)}
          className={({ isActive }) =>
            cn(
              "relative px-4 py-2 rounded-full",
              "text-neutral-600 dark:text-neutral-300",
              isActive && "text-cyan-500 dark:text-cyan-400"
            )
          }
        >
          {hovered === idx && (
            <div className="absolute inset-0 h-full w-full rounded-full bg-gray-100 dark:bg-neutral-800" />
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