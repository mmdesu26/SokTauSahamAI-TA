"use client";

import { cn } from "@/lib/utils";

export default function ShineForm({
  title,
  description,
  className = "",
  children,
}) {
  return (
    <div
      className={cn(
        "shadow-input mx-auto w-full max-w-md rounded-2xl p-6 md:p-8",
        className
      )}
    >
      {title && (
        <h2 className="text-xl font-bold text-center text-white">
          {title}
        </h2>
      )}

      {description && (
        <p className="mt-2 text-sm text-center text-slate-300">
          {description}
        </p>
      )}

      <div className="mt-6">{children}</div>
    </div>
  );
}
