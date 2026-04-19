// Card — wrapper konsisten, semua surface app pake ini
import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }) {
  return (
    <div
      // bg card pake token biar adaptif ke dark mode
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-card transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return (
    <div className={cn("flex flex-col gap-1.5 p-6", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children }) {
  // judul card — ukuran konsisten
  return (
    <h3 className={cn("text-lg font-semibold leading-tight", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children }) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
  );
}

export function CardContent({ className, children }) {
  return <div className={cn("px-6 pb-6", className)}>{children}</div>;
}

export function CardFooter({ className, children }) {
  return (
    <div
      className={cn(
        "flex items-center px-6 pb-6 pt-0 border-t-0",
        className
      )}
    >
      {children}
    </div>
  );
}
