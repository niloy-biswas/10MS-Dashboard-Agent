"use client";

import { motion } from "framer-motion";
import {
  Archive,
  Check,
  Database,
  FileEdit,
  GitBranch,
  LayoutList,
  Lock,
  Shield,
  Table2,
  X,
} from "lucide-react";
import { CAPABILITIES } from "@/components/marketing/config";
import { cn } from "@/lib/utils";

function CapabilityVisual({ id }: { id: string }) {
  switch (id) {
    case "registry":
      return (
        <div className="flex items-center gap-2 text-[10px]">
          {["Draft", "Published", "Archived"].map((s, i) => (
            <span
              key={s}
              className={cn(
                "rounded-full border px-2 py-1",
                i === 1
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border text-muted-foreground"
              )}
            >
              {i === 2 ? <Archive className="h-2.5 w-2.5 inline mr-1" /> : null}
              {s}
            </span>
          ))}
        </div>
      );
    case "context":
      return (
        <div className="space-y-1.5">
          {["Business rule", "Caveat", "Instruction"].map((r) => (
            <div
              key={r}
              className="rounded-md border border-border/50 bg-muted/20 px-2 py-1.5 text-[10px] text-muted-foreground flex items-center gap-1.5"
            >
              <FileEdit className="h-3 w-3 text-primary" />
              {r}
            </div>
          ))}
        </div>
      );
    case "tables":
      return (
        <div className="space-y-1.5">
          {[
            { name: "orders_fact", ok: true },
            { name: "campaigns", ok: true },
            { name: "tmp_refunds", ok: false },
          ].map((t) => (
            <div
              key={t.name}
              className={cn(
                "rounded-md border px-2 py-1.5 text-[10px] font-mono flex items-center justify-between",
                t.ok
                  ? "border-primary/30 bg-primary/5 text-foreground"
                  : "border-border/50 text-muted-foreground/60 line-through"
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                <Table2 className="h-3 w-3" />
                {t.name}
              </span>
              {t.ok ? (
                <Check className="h-3 w-3 text-primary" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </div>
          ))}
        </div>
      );
    case "sources":
      return (
        <div className="flex items-center gap-2 text-[10px]">
          <span className="rounded-lg border border-border/60 px-2 py-2 bg-muted/20">
            Revenue
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="rounded-lg border border-primary/30 px-2 py-2 bg-primary/5 inline-flex items-center gap-1">
            <Database className="h-3 w-3 text-primary" />
            BQ · prod
            <Lock className="h-3 w-3 text-primary" />
          </span>
        </div>
      );
    case "inspect":
      return (
        <div className="flex gap-1 flex-wrap">
          {["Answer", "Chart", "SQL", "Context"].map((t, i) => (
            <span
              key={t}
              className={cn(
                "text-[10px] px-2 py-1 rounded-md border",
                i === 2
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border/60 text-muted-foreground"
              )}
            >
              {t}
            </span>
          ))}
        </div>
      );
    case "roles":
      return (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground flex-wrap">
          <span className="rounded-md border border-border/60 px-2 py-1">Editor</span>
          <GitBranch className="h-3 w-3" />
          <span className="rounded-md border border-primary/30 bg-primary/10 text-primary px-2 py-1 inline-flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Admin
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="rounded-md border border-border/60 px-2 py-1">User</span>
        </div>
      );
    default:
      return <LayoutList className="h-4 w-4 text-primary" />;
  }
}

export function CapabilitiesSection() {
  return (
    <section className="border-b border-border/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
          Product
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 max-w-xl">
          Surprisingly responsible for an average analyst.
        </h2>
        <p className="text-muted-foreground max-w-xl mb-12 leading-relaxed">
          Governance first. Chat second. Every capability below exists to keep answers on the
          published path.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAPABILITIES.map((cap, i) => (
            <motion.article
              key={cap.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className="rounded-2xl border border-border/60 bg-card/40 p-5 flex flex-col gap-4"
            >
              <div className="min-h-[72px] rounded-xl border border-border/40 bg-muted/15 p-3 flex items-center">
                <CapabilityVisual id={cap.id} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1.5">{cap.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{cap.body}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
