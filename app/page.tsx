import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { LandingPageView } from "@/components/marketing/landing-page";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: {
    absolute: `${BRAND.name}: Governed AI Analytics`,
  },
  description: BRAND.description,
  openGraph: {
    title: BRAND.tagline,
    description: BRAND.ogDescription,
    type: "website",
    siteName: BRAND.name,
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.tagline,
    description: BRAND.ogDescription,
  },
};

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <LandingPageView isLoggedIn={!!user} />;
}
