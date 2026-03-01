"use client";

import { ShineBorder } from "@/components/ui/shine-border";

export default function ShineBorderWrapper({
  children,
  className = "",
}) {
  return (
    <div className={`relative rounded-xl ${className}`}>
      <ShineBorder
        borderWidth={3.5}
        duration={10}
        shineColor={["#f18cd8", "#3b82f6", "#0ea5e9"]}
        />
      {children}
    </div>
  );
}
