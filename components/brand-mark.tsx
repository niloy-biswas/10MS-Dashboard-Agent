import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

const SIZES = {
  sm: { box: "h-7 w-7", icon: "h-3.5 w-3.5", radius: "rounded-lg" },
  md: { box: "h-8 w-8", icon: "h-4 w-4", radius: "rounded-lg" },
  lg: { box: "h-12 w-12", icon: "h-6 w-6", radius: "rounded-xl" },
  xl: { box: "h-20 w-20", icon: "h-10 w-10", radius: "rounded-2xl" },
} as const;

export function BrandMark({
  className,
  showWordmark = true,
  size = "md",
}: {
  className?: string;
  showWordmark?: boolean;
  size?: keyof typeof SIZES;
}) {
  const { box, icon, radius } = SIZES[size];

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          box,
          radius,
          "bg-primary flex items-center justify-center shadow-[0_0_14px_var(--primary-glow)] shrink-0"
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
