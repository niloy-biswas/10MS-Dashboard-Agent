"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { HeroDemo } from "@/components/marketing/hero-demo";
import { GitHubIcon } from "@/components/marketing/github-icon";
import { TRUST_LABELS } from "@/components/marketing/config";
import { BRAND, marketingPrimaryCta } from "@/lib/brand";

export function HeroSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  const primary = marketingPrimaryCta(isLoggedIn);

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-12 sm:pt-16 pb-16 sm:pb-24">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-start">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="lg:pt-4"
        >
          <p className="text-xs font-mono uppercase tracking-widest text-primary mb-4">
            Governed AI analytics
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-foreground leading-[1.15] mb-5">
            {BRAND.tagline}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-lg mb-8">
            Ask questions in plain English and get charts, explanations, and inspectable
            SQL, grounded in your organization&apos;s approved dashboards, tables, and business
            rules.
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-4">
<Link
                href={primary.href}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-[0_0_20px_var(--primary-glow)]"
              >
                {primary.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={BRAND.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg border border-border bg-card/50 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
            >
              <GitHubIcon />
              View on GitHub
            </a>
          </div>
          <a
            href="#how-it-works"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            See how it works
          </a>

          <ul className="mt-8 flex flex-wrap gap-2">
            {TRUST_LABELS.map((label) => (
              <li
                key={label}
                className="text-[11px] font-medium tracking-wide text-muted-foreground border border-border/60 rounded-full px-3 py-1 bg-muted/20"
              >
                {label}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >
          <HeroDemo />
        </motion.div>
      </div>
    </section>
  );
}
