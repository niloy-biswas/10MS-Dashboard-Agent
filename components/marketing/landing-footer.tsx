import { BRAND, contactMailto } from "@/lib/brand";

export function LandingFooter() {
  return (
    <footer className="py-10 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">{BRAND.name}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{BRAND.footerLine}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Product
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#product" className="hover:text-foreground transition-colors">
                  Product
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-foreground transition-colors">
                  How it works
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-foreground transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-foreground transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Resources
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href={BRAND.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a href="#open-source" className="hover:text-foreground transition-colors">
                  Self-hosting
                </a>
              </li>
              <li>
                <a href="#open-source" className="hover:text-foreground transition-colors">
                  Roadmap
                </a>
              </li>
              <li>
                <span className="text-muted-foreground/60">Documentation (soon)</span>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Contact
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href={contactMailto()} className="hover:text-foreground transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <span className="text-muted-foreground/60">Privacy (soon)</span>
              </li>
              <li>
                <span className="text-muted-foreground/60">Terms (soon)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
