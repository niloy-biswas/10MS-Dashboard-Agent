"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQ_ITEMS } from "@/components/marketing/config";
import { cn } from "@/lib/utils";

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);

  return (
    <section id="faq" className="border-b border-border/40 bg-muted/10 scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-10">FAQ</h2>
        <div className="max-w-2xl divide-y divide-border/50 rounded-2xl border border-border/60 bg-card/30 overflow-hidden">
          {FAQ_ITEMS.map((item) => {
            const open = openId === item.id;
            return (
              <div key={item.id}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`faq-${item.id}`}
                    id={`faq-btn-${item.id}`}
                    onClick={() => setOpenId(open ? null : item.id)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors"
                  >
                    {item.question}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                        open && "rotate-180"
                      )}
                    />
                  </button>
                </h3>
                <div
                  id={`faq-${item.id}`}
                  role="region"
                  aria-labelledby={`faq-btn-${item.id}`}
                  hidden={!open}
                  className="px-5 pb-4"
                >
                  {open && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
