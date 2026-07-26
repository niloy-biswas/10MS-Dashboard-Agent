"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { AlertTriangle, CheckCircle2, Table2 } from "lucide-react";
import { INTEGRATION_LABELS } from "@/components/marketing/config";
import { usePrefersReducedMotion } from "@/components/marketing/use-reduced-motion";
import { cn } from "@/lib/utils";

export function CredibilityStrip() {
  return (
    <section className="border-y border-border/40 bg-muted/15">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
        <p className="text-sm text-muted-foreground text-center mb-5">
          Built from real analytics workflows at{" "}
          <span className="text-foreground font-medium">10 Minute School</span>.
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {INTEGRATION_LABELS.map((label) => (
            <li
              key={label}
              className="text-xs font-medium text-muted-foreground border border-border/50 rounded-lg px-3 py-1.5 bg-card/30"
            >
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const GENERIC_TABLES = [
  "orders_raw",
  "orders_v2",
  "tmp_refunds",
  "finance_export",
  "stg_orders",
  "internal_test",
];

export function ProblemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduced = usePrefersReducedMotion();

  return (
    <section id="product" className="border-b border-border/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
          The problem
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight max-w-2xl mb-4">
          AI knows SQL. It does not know what your business means.
        </h2>
        <p className="text-muted-foreground max-w-2xl leading-relaxed mb-12">
          Generic tools can reach a warehouse. They still do not know your approved revenue
          definition, which tables are authoritative, what to exclude, which caveats matter, or
          whether a dashboard is published.
        </p>

        <div ref={ref} className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {/* Generic side */}
          <div className="rounded-2xl border border-destructive/25 bg-card/40 p-5 sm:p-6 relative overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-wide text-destructive mb-4">
              Generic AI
            </p>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {GENERIC_TABLES.map((t, i) => (
                <motion.div
                  key={t}
                  initial={reduced ? false : { opacity: 0.35 }}
                  animate={
                    inView
                      ? {
                          opacity: [0.35, 1, 0.45],
                          borderColor: i === 1 || i === 4 ? "var(--destructive)" : undefined,
                        }
                      : undefined
                  }
                  transition={{ duration: 1.6, delay: i * 0.08, repeat: reduced ? 0 : 1 }}
                  className={cn(
                    "rounded-md border border-border/60 px-2 py-2 text-[10px] font-mono text-muted-foreground truncate",
                    (i === 1 || i === 4) && "border-destructive/40 bg-destructive/5"
                  )}
                >
                  <Table2 className="h-3 w-3 inline mr-1 opacity-50" />
                  {t}
                </motion.div>
              ))}
            </div>
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">Revenue</p>
              <p className="text-xl font-bold tabular-nums">$1.8M</p>
              <p className="mt-2 text-xs text-destructive inline-flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                Included refunds and internal transactions.
              </p>
            </div>
          </div>

          {/* Average Analyst side */}
          <div className="rounded-2xl border border-primary/30 bg-card/40 p-5 sm:p-6 relative overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-4">
              Average Analyst
            </p>
            <ul className="space-y-2 mb-5">
              {[
                "Published · Revenue dashboard",
                "Approved · orders_fact, campaigns, enrolments",
                "Rule · exclude refunds & internal",
                "Caveat · campaign ended mid-month",
              ].map((line, i) => (
                <motion.li
                  key={line}
                  initial={reduced ? false : { opacity: 0, x: 8 }}
                  animate={inView ? { opacity: 1, x: 0 } : undefined}
                  transition={{ duration: 0.35, delay: 0.15 + i * 0.1 }}
                  className="flex items-center gap-2 text-xs text-foreground/90 rounded-md border border-border/50 bg-muted/20 px-3 py-2"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  {line}
                </motion.li>
              ))}
            </ul>
            <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">Net revenue</p>
              <p className="text-xl font-bold tabular-nums">$1.42M</p>
              <p className="mt-2 text-xs text-primary inline-flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                Refunds and internal transactions excluded.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
