import { CometCard } from "@/components/ui/comet-card"

export default function CometCardWrapper({ children, className = "" }) {
  return (
    <CometCard>
      <div
        className={className}
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </div>
    </CometCard>
  )
}
