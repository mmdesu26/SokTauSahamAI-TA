import { Boxes } from "@/components/ui/background-boxes";

export default function BoxesWrapper({ children, className = "" }) {
  return (
    <section
      className={`relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-primary-dark ${className}`}
    >
      <div className="absolute inset-0 z-0">
        <Boxes className="h-full w-full text-accent opacity-40" />
      </div>

      <div className="relative z-10 w-full">
        {children}
      </div>
    </section>
  );
}