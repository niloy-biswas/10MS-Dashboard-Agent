"use client";

import { LandingHeader } from "@/components/marketing/landing-header";
import { HeroSection } from "@/components/marketing/hero-section";
import {
  CredibilityStrip,
  ProblemSection,
} from "@/components/marketing/problem-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works";
import { CapabilitiesSection } from "@/components/marketing/capabilities-section";
import { AnalyticsShowcase } from "@/components/marketing/analytics-showcase";
import { GovernanceWorkflow } from "@/components/marketing/governance-workflow";
import { ComparisonSection } from "@/components/marketing/comparison-section";
import { DeploymentSection } from "@/components/marketing/deployment-section";
import { PricingContactSection } from "@/components/marketing/pricing-section";
import { TransparencySection } from "@/components/marketing/transparency-section";
import { PersonalityBreak } from "@/components/marketing/personality-break";
import { FaqSection } from "@/components/marketing/faq-section";
import { FinalCta } from "@/components/marketing/final-cta";
import { LandingFooter } from "@/components/marketing/landing-footer";

export function LandingPageView({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute top-[-18%] left-1/2 -translate-x-1/2 w-[720px] h-[480px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-[35%] right-[-10%] w-[420px] h-[420px] rounded-full bg-[var(--chart-primary-glow)] blur-[100px]" />
        <div className="absolute bottom-[10%] left-[-5%] w-[320px] h-[320px] rounded-full bg-[var(--brand-red-glow)] blur-[90px]" />
      </div>

      <LandingHeader isLoggedIn={isLoggedIn} />

      <main className="relative z-10 flex-1">
        <HeroSection isLoggedIn={isLoggedIn} />
        <CredibilityStrip />
        <ProblemSection />
        <HowItWorksSection />
        <CapabilitiesSection />
        <AnalyticsShowcase />
        <GovernanceWorkflow />
        <ComparisonSection />
        <DeploymentSection />
        <PricingContactSection />
        <TransparencySection />
        <PersonalityBreak />
        <FaqSection />
        <FinalCta isLoggedIn={isLoggedIn} />
      </main>

      <div className="relative z-10">
        <LandingFooter />
      </div>
    </div>
  );
}
