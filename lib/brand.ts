/**
 * Product brand. Change here when renaming. UI and landing copy import from this module.
 */
export const BRAND = {
  name: "Average Analyst",
  tagline: "Above-average answers from Average Analyst.",
  description:
    "Ask questions in plain English and get charts, explanations, and SQL grounded in approved dashboards, tables, and business rules.",
  ogDescription:
    "Governed AI analytics with published context, approved tables, inspectable SQL, and self-hosted deployment options.",
  /** Short line under the name in product chrome */
  productLabel: "Governed AI analytics",
  supportEmail: "hello@niloy.tech",
  githubUrl: "https://github.com/niloy-biswas/Average-Analyst",
  footerLine: "Average Analyst. Above-average answers from your data.",
} as const;

/** Primary marketing CTA: signup vs open product. */
export function marketingPrimaryCta(isLoggedIn: boolean): {
  href: "/app" | "/signup";
  label: string;
} {
  return isLoggedIn
    ? { href: "/app", label: "Open app" }
    : { href: "/signup", label: "Ask Average Analyst" };
}

export function contactMailto(subject?: string): string {
  if (!subject) return `mailto:${BRAND.supportEmail}`;
  return `mailto:${BRAND.supportEmail}?subject=${encodeURIComponent(subject)}`;
}
