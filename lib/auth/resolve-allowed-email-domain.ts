import { adminGetSetting } from "@/lib/supabase/admin-queries";
import { normalizeAllowedEmailDomainHost } from "./allowed-email-domain";

/** DB `app_settings.allowed_email_domain`, then `ALLOWED_EMAIL_DOMAIN`, then `*`. */
export async function resolveAllowedEmailDomainHost(): Promise<string> {
  const fromDb = await adminGetSetting("allowed_email_domain");
  const combined = (fromDb ?? process.env.ALLOWED_EMAIL_DOMAIN ?? "*").trim();
  return normalizeAllowedEmailDomainHost(combined || "*");
}
