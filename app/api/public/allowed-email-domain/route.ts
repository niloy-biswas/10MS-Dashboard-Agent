import { NextResponse } from "next/server";
import { resolveAllowedEmailDomainHost } from "@/lib/auth/resolve-allowed-email-domain";

/** Unauthenticated: exposes current email-domain policy for login/signup UI (not a secret). */
export async function GET() {
  try {
    const allowed_email_domain = await resolveAllowedEmailDomainHost();
    return NextResponse.json(
      { allowed_email_domain },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
    );
  } catch {
    return NextResponse.json({ allowed_email_domain: "*" });
  }
}
