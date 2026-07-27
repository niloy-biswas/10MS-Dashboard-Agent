import { cn } from "@/lib/utils";
import type { StatusBadge } from "@/components/marketing/config";

export function StatusPill({ status }: { status: StatusBadge }) {
  return (
    <span
      className={cn(
        "text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full border",
        status === "Available"
          ? "border-primary/30 text-primary bg-primary/10"
          : "border-border text-muted-foreground bg-muted/50"
      )}
    >
      {status}
    </span>
  );
}
