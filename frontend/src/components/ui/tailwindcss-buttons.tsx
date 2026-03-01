"use client";

import React from "react";
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export function StyleButtonBase({
  children,
  className,
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        "relative p-[3px] rounded-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.03]",
        className
      )}
      {...props}
    >
      {/* Cyan-Blue Gradient Border */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg blur-[1px]" />

      {/* Inner Button */}
      <div className="relative px-8 py-2 bg-slate-900 rounded-[6px] text-white font-semibold transition-all duration-300 hover:bg-cyan-600 hover:text-white shadow-lg hover:shadow-cyan-500/30">
        {children}
      </div>
    </button>
  );
}
