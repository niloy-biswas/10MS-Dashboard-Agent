"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Eye, FileEdit, MessageSquare, Search, Shield } from "lucide-react";
import { usePrefersReducedMotion } from "@/components/marketing/use-reduced-motion";
import { cn } from "@/lib/utils";

const STAGES = [
  {
    id: "draft",
    title: "Draft",
    body: "Editor updates rules. Context is not visible to chat users.",
    icon: FileEdit,
  },
  {
    id: "review",
    title: "Review",
    body: "Approved tables and caveats are checked while the dashboard stays in draft.",
    icon: Search,
  },
  {
    id: "publish",
    title: "Publish",
    body: "Admin publishes. Published context becomes available to users.",
    icon: Shield,
  },
  {
    id: "ask",
    title: "Ask",
    body: "User asks against the published version only.",
    icon: MessageSquare,
  },
  {
    id: "inspect",
    title: "Inspect",
    body: "User can inspect query, chart, tables, and applied rules.",
    icon: Eye,
  },
];

export function GovernanceWorkflow() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const reduced = usePrefersReducedMotion();

  return (
    <section className="border-b border-border/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight max-w-2xl mb-3">
          The answer is only as trustworthy as the context behind it.
        </h2>
        <p className="text-muted-foreground max-w-xl mb-12 leading-relaxed">
          Draft → Review → Publish → Ask → Inspect. No chat until an admin publishes.
        </p>

        <div ref={ref} className="relative">
          {/* Desktop path */}
          <div className="hidden lg:block absolute top-[28px] left-8 right-8 h-px bg-border/60" aria-hidden />
          <motion.div
            className="hidden lg:block absolute top-[28px] left-8 h-px bg-primary/70 origin-left"
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: reduced ? 0 : 1.1, ease: "easeOut" }}
            style={{ width: "calc(100% - 4rem)" }}
            aria-hidden
          />

          <ol className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {STAGES.map((stage, i) => (
              <motion.li
                key={stage.id}
                initial={reduced ? false : { opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : undefined}
                transition={{ duration: 0.35, delay: reduced ? 0 : i * 0.1 }}
                className={cn(
                  "rounded-2xl border border-border/60 bg-card/40 p-4 relative",
                  i === 2 && "border-primary/35"
                )}
              >
                <div
                  className={cn(
                    "h-7 w-7 rounded-full border flex items-center justify-center mb-3 bg-background",
                    i === 2 ? "border-primary/50 text-primary" : "border-border text-muted-foreground"
                  )}
                >
                  <stage.icon className="h-3.5 w-3.5" />
                </div>
                <p className="text-sm font-semibold mb-1">{stage.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{stage.body}</p>
              </motion.li>
            ))}
          </ol>

          <motion.div
            className="mt-6 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-xs text-muted-foreground inline-flex items-center gap-2"
            initial={reduced ? false : { opacity: 0 }}
            animate={inView ? { opacity: 1 } : undefined}
            transition={{ delay: 0.5 }}
          >
            <span className={cn("h-2 w-2 rounded-full bg-primary", !reduced && "animate-pulse")} aria-hidden />
            Context package moves with the dashboard, not a separate approval product.
          </motion.div>
        </div>
      </div>
    </section>
  );
}
