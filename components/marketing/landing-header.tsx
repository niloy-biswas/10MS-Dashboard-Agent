"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BrandMark } from "@/components/brand-mark";
import { GitHubIcon } from "@/components/marketing/github-icon";
import { MARKETING_NAV } from "@/components/marketing/config";
import { BRAND, marketingPrimaryCta } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function LandingHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const primary = marketingPrimaryCta(isLoggedIn);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors",
        scrolled
          ? "border-border/50 bg-background/80 backdrop-blur-md"
          : "border-transparent bg-background/40 backdrop-blur-sm"
      )}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <Link href="/" className="shrink-0" onClick={() => setOpen(false)}>
          <BrandMark />
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm text-muted-foreground">
          {MARKETING_NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <a
            href={BRAND.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="View on GitHub"
          >
            <GitHubIcon />
          </a>
          <ThemeToggle />
          {!isLoggedIn && (
            <Link
              href="/login"
              className="hidden md:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 transition-colors"
            >
              Sign in
            </Link>
          )}
          <Link
            href={primary.href}
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {primary.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            className="lg:hidden h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-nav"
          className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-md"
        >
          <nav className="mx-auto max-w-6xl px-4 py-4 flex flex-col gap-1">
            {MARKETING_NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              href={BRAND.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted inline-flex items-center gap-2"
              onClick={() => setOpen(false)}
            >
              <GitHubIcon />
              GitHub
            </a>
            {!isLoggedIn && (
              <Link
                href="/login"
                className="rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
            )}
            <Link
              href={primary.href}
              className="mt-2 inline-flex items-center justify-center gap-1.5 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              {primary.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
