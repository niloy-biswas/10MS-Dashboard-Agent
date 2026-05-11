/**
 * Allowed signup / Google email domain from `app_settings.allowed_email_domain`
 * (plain hostname, no @) or "*" for unrestricted.
 */

export function normalizeAllowedEmailDomainHost(raw: string | null | undefined): string {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v || v === "*") return "*";
  return v.startsWith("@") ? v.slice(1) : v;
}

export function emailMatchesAllowedDomain(email: string, domainHost: string): boolean {
  const host = normalizeAllowedEmailDomainHost(domainHost);
  if (host === "*") return true;
  const e = email.trim().toLowerCase();
  return e.endsWith("@" + host);
}

/** Google `hd` hint — omit when domain is unrestricted. */
export function googleOAuthHostedDomain(domainHost: string): string | undefined {
  const host = normalizeAllowedEmailDomainHost(domainHost);
  if (host === "*") return undefined;
  return host;
}
