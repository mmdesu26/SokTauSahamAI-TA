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
        shineColor={["#1C4D8D", "#4988C4", "#BDE8F5"]}
      />
      {children}
    </div>
  );
}