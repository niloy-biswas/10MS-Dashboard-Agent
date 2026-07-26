"use client";

import { ArrowRight, Cloud, Server, Sparkles, Wrench } from "lucide-react";
import { OFFERINGS } from "@/components/marketing/config";
import { StatusPill } from "@/components/marketing/status-pill";

const OFFERING_ICONS = {
  community: Server,
  cloud: Cloud,
  implementation: Wrench,
  api: Sparkles,
} as const;

export function DeploymentSection() {
  return (
    <section id="open-source" className="border-b border-border/40 scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
          Run it your way
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight max-w-2xl mb-3">
          Keep your data, and your average analyst, where you want them.
        </h2>
        <p className="text-muted-foreground max-w-xl mb-10 leading-relaxed">
          Software, hosting, and services are separate. Roadmap items stay labeled as roadmap.
        </p>

        <div className="grid gap-4">
          {OFFERINGS.map((o) => {
            const Icon = OFFERING_ICONS[o.id as keyof typeof OFFERING_ICONS] ?? Server;
            const isDisabled = o.status === "Coming soon";
            return (
              <article
                key={o.id}
                className="rounded-2xl border border-border/60 bg-card/40 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold">{o.title}</h3>
                      <StatusPill status={o.status} />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{o.body}</p>
                  </div>
                </div>
                {isDisabled ? (
                  <span className="text-xs text-muted-foreground px-3 py-2 shrink-0">
                    {o.ctaLabel}
                  </span>
                ) : (
                  <a
                    href={o.ctaHref}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline shrink-0"
                  >
                    {o.ctaLabel}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
