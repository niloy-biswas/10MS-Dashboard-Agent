"use client";

import { COMPARISON_ROWS } from "@/components/marketing/config";

export function ComparisonSection() {
  return (
    <section className="border-b border-border/40 bg-muted/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
          Not another SQL chatbot.
        </h2>
        <p className="text-muted-foreground max-w-xl mb-10 leading-relaxed">
          Average Analyst works beside your existing BI tools. It does not need to replace them.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-border/60">
          <table className="w-full min-w-[560px] text-sm text-left">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-3 font-semibold text-foreground">Capability</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Generic SQL chatbot</th>
                <th className="px-4 py-3 font-semibold text-primary">Average Analyst</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.capability} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{row.capability}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.generic}</td>
                  <td className="px-4 py-3 text-foreground">{row.ours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
