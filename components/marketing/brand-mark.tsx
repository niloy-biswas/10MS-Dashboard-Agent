import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

export function BrandMark({
  className,
  showWordmark = true,
  size = "md",
}: {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          box,
          "rounded-lg bg-primary flex items-center justify-center shadow-[0_0_14px_var(--primary-glow)] shrink-0"
        )}
        aria-hidden
      >
        <Layers className={cn(icon, "text-primary-foreground")} />
      </span>
      {showWordmark ? (
        <span className="text-sm font-bold tracking-tight text-foreground">
          {BRAND.name}
        </span>
      ) : (
        <span className="sr-only">{BRAND.name}</span>
      )}
    </span>
  );
}
