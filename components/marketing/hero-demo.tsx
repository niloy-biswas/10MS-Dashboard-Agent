"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Code2, FileText, LayoutList, LineChart as LineChartIcon } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import {
  HERO_ANSWER,
  HERO_CHART_DATA,
  HERO_CONTEXT_STEPS,
  HERO_DEMO_QUESTION,
} from "@/components/marketing/demo-data";
import { usePrefersReducedMotion } from "@/components/marketing/use-reduced-motion";
import { cn } from "@/lib/utils";

type DemoTab = "answer" | "chart" | "sql" | "context";
type Stage = "idle" | "question" | "context" | "result";

export function HeroDemo() {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [contextDone, setContextDone] = useState(0);
  const [tab, setTab] = useState<DemoTab>("answer");
  const [metric, setMetric] = useState(0);
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;

    if (reduced) {
      setStage("result");
      setContextDone(HERO_CONTEXT_STEPS.length);
      setMetric(HERO_ANSWER.metricValue);
      setChartReady(true);
      setTab("answer");
      return;
    }

    let cancelled = false;
    const timers: number[] = [];

    const run = () => {
      setStage("idle");
      setContextDone(0);
      setMetric(0);
      setChartReady(false);
      setTab("answer");

      timers.push(
        window.setTimeout(() => {
          if (!cancelled) setStage("question");
        }, 120)
      );

      timers.push(
        window.setTimeout(() => {
          if (!cancelled) setStage("context");
        }, 700)
      );

      HERO_CONTEXT_STEPS.forEach((_, i) => {
        timers.push(
          window.setTimeout(() => {
            if (!cancelled) setContextDone(i + 1);
          }, 950 + i * 380)
        );
      });

      const resultAt = 950 + HERO_CONTEXT_STEPS.length * 380 + 200;
      timers.push(
        window.setTimeout(() => {
          if (cancelled) return;
          setStage("result");
          setChartReady(true);
        }, resultAt)
      );

      // Count-up metric
      timers.push(
        window.setTimeout(() => {
          if (cancelled) return;
          const target = HERO_ANSWER.metricValue;
          const start = performance.now();
          const duration = 900;
          const tick = (now: number) => {
            if (cancelled) return;
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setMetric(Number((target * eased).toFixed(2)));
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }, resultAt + 50)
      );
    };

    run();
    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [inView, reduced]);

  const tabs: Array<{ id: DemoTab; label: string; icon: typeof FileText }> = [
    { id: "answer", label: "Answer", icon: FileText },
    { id: "chart", label: "Chart", icon: LineChartIcon },
    { id: "sql", label: "SQL", icon: Code2 },
    { id: "context", label: "Context", icon: LayoutList },
  ];

  return (
    <div
      ref={rootRef}
      className="relative rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden shadow-2xl"
      aria-label="Product demonstration of Average Analyst answering a revenue question"
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent pointer-events-none" />

      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/20">
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="ml-2 text-xs text-muted-foreground font-mono truncate">
          Revenue · Published
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-4 min-h-[420px] sm:min-h-[460px]">
        {/* User question */}
        <AnimatePresence>
          {(stage === "question" || stage === "context" || stage === "result") && (
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex justify-end"
            >
              <div className="max-w-[90%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5 text-sm leading-relaxed">
                {HERO_DEMO_QUESTION}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Context checks */}
        <AnimatePresence>
          {(stage === "context" || stage === "result") && (
            <motion.ul
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              {HERO_CONTEXT_STEPS.map((step, i) => {
                const done = contextDone > i || stage === "result";
                const active = contextDone === i && stage === "context";
                if (!done && !active) return null;
                return (
                  <motion.li
                    key={step}
                    initial={reduced ? false : { opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <span
                      className={cn(
                        "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                        done
                          ? "border-primary/40 bg-primary/15 text-primary"
                          : "border-border"
                      )}
                    >
                      {done && <Check className="h-2.5 w-2.5" />}
                    </span>
                    {step}
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>

        {/* Result panel */}
        <AnimatePresence>
          {stage === "result" && (
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="rounded-xl border border-border/60 bg-background/60 overflow-hidden"
            >
              <div className="px-3 sm:px-4 pt-3 flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium text-primary tracking-wide">
                  {HERO_ANSWER.foundLabel}
                </p>
                <div
                  className="flex gap-1 overflow-x-auto"
                  role="tablist"
                  aria-label="Inspect answer"
                >
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={tab === t.id}
                      onClick={() => setTab(t.id)}
                      className={cn(
                        "inline-flex items-center gap-1 shrink-0 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                        tab === t.id
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <t.icon className="h-3 w-3" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 sm:p-4" role="tabpanel">
                {tab === "answer" && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-end gap-3">
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                          {HERO_ANSWER.metricLabel}
                        </p>
                        <p className="text-2xl font-bold tabular-nums text-foreground">
                          ${metric.toFixed(2)}
                          {HERO_ANSWER.metricUnit}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-destructive tabular-nums pb-1">
                        {HERO_ANSWER.changePct}%
                      </p>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      {HERO_ANSWER.headline} {HERO_ANSWER.detail}
                    </p>
                  </div>
                )}

                {tab === "chart" && (
                  <div>
                    <div className="h-48 sm:h-56 w-full">
                      {chartReady && (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart
                            data={HERO_CHART_DATA}
                            margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="var(--border)"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="week"
                              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                background: "var(--popover)",
                                border: "1px solid var(--border)",
                                borderRadius: 8,
                                fontSize: 12,
                              }}
                            />
                            <ReferenceLine
                              x="W4"
                              stroke="var(--primary)"
                              strokeDasharray="4 4"
                              label={{
                                value: "Campaign end",
                                fill: "var(--muted-foreground)",
                                fontSize: 10,
                                position: "insideTopRight",
                              }}
                            />
                            <Bar
                              dataKey="enrolments"
                              fill="var(--chart-primary)"
                              opacity={0.35}
                              radius={[4, 4, 0, 0]}
                              isAnimationActive={!reduced}
                              animationDuration={900}
                            />
                            <Line
                              type="monotone"
                              dataKey="revenue"
                              stroke="var(--primary)"
                              strokeWidth={2}
                              dot={false}
                              isAnimationActive={!reduced}
                              animationDuration={1100}
                            />
                            <Line
                              type="monotone"
                              dataKey="previous"
                              stroke="var(--muted-foreground)"
                              strokeWidth={1.5}
                              strokeDasharray="4 4"
                              dot={false}
                              isAnimationActive={!reduced}
                              animationDuration={1100}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <p className="sr-only">
                      Combination chart of weekly revenue and enrolments with previous-period
                      comparison and a campaign-end annotation at week 4.
                    </p>
                  </div>
                )}

                {tab === "sql" && (
                  <pre className="text-[11px] sm:text-xs font-mono text-muted-foreground overflow-x-auto leading-relaxed whitespace-pre">
                    {HERO_ANSWER.sql}
                  </pre>
                )}

                {tab === "context" && (
                  <ul className="space-y-2">
                    {HERO_ANSWER.contextTags.map((tag) => (
                      <li
                        key={tag}
                        className="text-xs rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-foreground/90"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fake input */}
        <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 flex items-center gap-2">
          <span className="text-sm text-muted-foreground/70 flex-1 truncate">
            Ask Average Analyst…
          </span>
          <span className="h-7 px-2.5 rounded-md bg-primary/80 text-primary-foreground text-xs font-medium inline-flex items-center">
            Send
          </span>
        </div>
      </div>
    </div>
  );
}
