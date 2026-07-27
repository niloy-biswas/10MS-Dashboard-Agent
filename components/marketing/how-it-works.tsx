"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Lock, MessageSquare, Shield, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    id: "connect",
    title: "Connect",
    phrase: "Connect your data.",
    body: "Connect a data source and assign it to a dashboard.",
    visual: "connect" as const,
  },
  {
    id: "govern",
    title: "Govern",
    phrase: "Publish to Average Analyst.",
    body: "Add approved tables, business rules, caveats, instructions, and example questions. Keep the context in draft until it is ready.",
    visual: "govern" as const,
  },
  {
    id: "ask",
    title: "Ask",
    phrase: "Ask Average Analyst.",
    body: "Users ask questions only against published context and receive answers, charts, and inspectable SQL.",
    visual: "ask" as const,
  },
];

function StepVisual({ kind }: { kind: "connect" | "govern" | "ask" }) {
  if (kind === "connect") {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 flex items-start gap-3">
          <Database className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">BigQuery · Production</p>
            <p className="text-xs text-muted-foreground mt-0.5">asia-south1 · Data Viewer</p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-primary">
              <Lock className="h-3 w-3" />
              Credentials encrypted
            </p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-xs"
        >
          Assigned to <span className="font-semibold text-foreground">Revenue</span> dashboard
        </motion.div>
      </div>
    );
  }

  if (kind === "govern") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-medium">Context editor</span>
          <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
            Draft
          </span>
        </div>
        {["Net revenue excludes refunds", "Approved · orders_fact", "Caveat · campaign ended"].map(
          (line, i) => (
            <motion.div
              key={line}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-foreground/90"
            >
              {line}
            </motion.div>
          )
        )}
        <div className="pt-2">
          <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
            <Shield className="h-3.5 w-3.5" />
            Publish
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl rounded-br-md bg-primary text-primary-foreground px-3 py-2 text-xs ml-auto max-w-[85%]">
        Why did revenue fall last month?
      </div>
      <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2">
        <p className="text-[11px] text-primary font-medium">Average Analyst found something</p>
        <p className="text-xs text-foreground leading-relaxed">
          Net revenue −12.4%. Largest decline from SSC after campaign end.
        </p>
        <div className="flex gap-1.5 pt-1">
          {["Answer", "Chart", "SQL", "Context"].map((t) => (
            <span
              key={t}
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-md border border-border/60",
                t === "SQL" ? "bg-primary/15 text-primary border-primary/30" : "text-muted-foreground"
              )}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
        <MessageSquare className="h-3 w-3" />
        Published context only
      </p>
    </div>
  );
}

export function HowItWorksSection() {
  const [active, setActive] = useState(0);
  const step = STEPS[active];

  return (
    <section id="how-it-works" className="border-b border-border/40 bg-muted/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
          How it works
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
          Three steps. Fewer questionable answers.
        </h2>
        <p className="text-muted-foreground max-w-xl mb-10 leading-relaxed">
          Connect a source, publish governed context, then ask. Average Analyst stays on the
          approved path.
        </p>

        {/* Desktop stepper */}
        <div className="hidden md:grid md:grid-cols-[220px_1fr] gap-8 items-start">
          <ol className="space-y-2">
            {STEPS.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  className={cn(
                    "w-full text-left rounded-xl border px-4 py-3 transition-colors",
                    active === i
                      ? "border-primary/40 bg-primary/10"
                      : "border-border/50 bg-card/30 hover:bg-muted/40"
                  )}
                >
                  <span className="text-[11px] font-mono text-muted-foreground">0{i + 1}</span>
                  <p className="text-sm font-semibold mt-0.5">{s.title}</p>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "ml-6 h-4 w-px",
                      active > i ? "bg-primary/50" : "bg-border/60"
                    )}
                    aria-hidden
                  />
                )}
              </li>
            ))}
          </ol>

          <div className="rounded-2xl border border-border/60 bg-card/40 p-6 min-h-[280px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35 }}
              >
                <p className="text-xs text-primary font-medium mb-2">{step.phrase}</p>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{step.body}</p>
                <StepVisual kind={step.visual} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile stacked */}
        <div className="md:hidden space-y-4">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className="rounded-2xl border border-border/60 bg-card/40 p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-[11px] font-mono text-muted-foreground">0{i + 1}</span>
                <span className="text-sm font-semibold">{s.title}</span>
              </div>
              <p className="text-xs text-primary font-medium mb-1">{s.phrase}</p>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{s.body}</p>
              <StepVisual kind={s.visual} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
