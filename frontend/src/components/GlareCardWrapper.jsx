import { GlareCard } from "@/components/ui/glare-card";

export default function GlareCardWrapper({ children, className = "" }) {
  return (
    <div className="w-full">
      <GlareCard className={className}>
        <div className="h-full w-full rounded-[48px]">
          {children}
        </div>
      </GlareCard>
    </div>
  );
}