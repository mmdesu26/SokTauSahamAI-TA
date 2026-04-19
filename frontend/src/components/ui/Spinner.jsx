// Spinner kecil buat loading state
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Spinner({ className, label }) {
  return (
    <div className={cn("flex items-center justify-center gap-2 text-muted-foreground", className)}>
      {/* loader2 dr lucide udah include animate-spin sendiri kalo dikasih class */}
      <Loader2 className="h-4 w-4 animate-spin" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
