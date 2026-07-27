"use client";

import { TRANSPARENCY_POINTS } from "@/components/marketing/config";
import { cn } from "@/lib/utils";

const ARCH_NODES = [
  "User",
  "Published context",
  "Agent",
  "Approved tables",
  "Data source",
  "Answer",
] as const;

export function TransparencySection() {
  return (
    <section className="border-b border-border/40 bg-muted/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
          Average at secrets. Good at keeping them.
        </h2>
        <p className="text-muted-foreground max-w-xl mb-10 leading-relaxed">
          Warehouse data is queried in place, not copied into the application. Credentials and
          context stay under your control.
        </p>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <ol className="space-y-2.5">
            {TRANSPARENCY_POINTS.map((point) => (
              <li
                key={point}
                className="text-sm text-foreground/90 rounded-xl border border-border/50 bg-card/30 px-4 py-3 leading-relaxed"
              >
                {point}
              </li>
            ))}
          </ol>

          <div className="rounded-2xl border border-border/60 bg-card/40 p-5 sm:p-6 overflow-x-auto">
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-4">
              Architecture
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {ARCH_NODES.map((node, i) => (
                <div key={node} className="contents">
                  <span
                    className={cn(
                      "rounded-lg border px-2.5 py-2 whitespace-nowrap",
                      i === 1 || i === 3
                        ? "border-primary/35 bg-primary/10 text-primary"
                        : "border-border/60 bg-muted/20 text-foreground"
                    )}
                  >
                    {node}
                  </span>
                  {i < ARCH_NODES.length - 1 && (
                    <span className="text-muted-foreground" aria-hidden>
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
              Queries run against the configured BigQuery project. Chat messages and encrypted
              credentials live in your Supabase project.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
