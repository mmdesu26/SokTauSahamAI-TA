import { AuroraText } from "@/components/ui/aurora-text"

export default function AuroraTextWrapper({
  children,
  className = "",
}) {
  return (
    <AuroraText
      className={`font-bold tracking-tight ${className}`}
      colors={["#06b6d4", "#3b82f6", "#0ea5e9"]}
      speed={1.2}
    >
      {children}
    </AuroraText>
  )
}
