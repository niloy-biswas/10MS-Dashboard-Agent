"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SHOWCASE_QUESTIONS } from "@/components/marketing/demo-data";
import { usePrefersReducedMotion } from "@/components/marketing/use-reduced-motion";
import { cn } from "@/lib/utils";

const SERIES_COLORS = [
  "var(--primary)",
  "var(--chart-primary)",
  "var(--muted-foreground)",
  "hsl(var(--chart-4, 160 60% 45%))",
];

export function AnalyticsShowcase() {
  const [activeId, setActiveId] = useState(SHOWCASE_QUESTIONS[0].id);
  const reduced = usePrefersReducedMotion();
  const q = SHOWCASE_QUESTIONS.find((x) => x.id === activeId) ?? SHOWCASE_QUESTIONS[0];

  return (
    <section className="border-b border-border/40 bg-muted/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 max-w-xl">
          Ask a business question. Get more than a sentence.
        </h2>
        <p className="text-muted-foreground max-w-xl mb-10 leading-relaxed">
          Pick a question. Average Analyst responds with a metric, chart, observation, and the
          context that scoped it.
        </p>

        <div className="grid lg:grid-cols-[280px_1fr] gap-4 lg:gap-6">
          <div
            className="flex lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0"
            role="tablist"
            aria-label="Sample questions"
          >
            {SHOWCASE_QUESTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={activeId === item.id}
                onClick={() => setActiveId(item.id)}
                className={cn(
                  "shrink-0 text-left rounded-xl border px-3.5 py-3 text-sm transition-colors max-w-[260px] lg:max-w-none",
                  activeId === item.id
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-border/50 bg-card/30 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                {item.question}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={q.id}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-border/60 bg-card/40 p-5 sm:p-6"
              role="tabpanel"
            >
              <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {q.metricLabel}
                  </p>
                  <p className="text-2xl font-bold tabular-nums">{q.metricValue}</p>
                </div>
                <ul className="flex flex-wrap gap-1.5">
                  {q.contextTags.map((tag) => (
                    <li
                      key={tag}
                      className="text-[10px] rounded-full border border-border/60 px-2.5 py-0.5 text-muted-foreground"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-sm text-foreground leading-relaxed mb-2">{q.summary}</p>
              <p className="text-xs text-muted-foreground mb-5">{q.observation}</p>

              <div className="h-52 sm:h-60 w-full">
                <ShowcaseChart q={q} reduced={reduced} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{q.textualSummary}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function ShowcaseChart({
  q,
  reduced,
}: {
  q: (typeof SHOWCASE_QUESTIONS)[number];
  reduced: boolean;
}) {
  const anim = !reduced;

  if (q.chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={q.data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          {q.series.map((s, i) => (
            <Line
              key={s}
              type="monotone"
              dataKey={s}
              stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
              strokeWidth={2}
              strokeDasharray={i === 1 ? "4 4" : undefined}
              dot={false}
              isAnimationActive={anim}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (q.chartType === "hbar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={q.data}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={56}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar
            dataKey="growth"
            fill="var(--primary)"
            radius={[0, 4, 4, 0]}
            isAnimationActive={anim}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (q.chartType === "stacked") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={q.data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          {q.series.map((s, i) => (
            <Bar
              key={s}
              dataKey={s}
              stackId="a"
              fill={SERIES_COLORS[i % SERIES_COLORS.length]}
              opacity={0.85 - i * 0.1}
              isAnimationActive={anim}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={q.data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area
          type="monotone"
          dataKey="questions"
          stroke="var(--primary)"
          fill="var(--primary)"
          fillOpacity={0.2}
          isAnimationActive={anim}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};
