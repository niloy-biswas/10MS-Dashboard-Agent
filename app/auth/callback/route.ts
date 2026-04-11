import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription ?? error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const cookieStore = await cookies();

  // Collect cookies that Supabase wants to set so we can apply them
  // directly to the redirect response (cookieStore.set alone doesn't
  // carry over to a NextResponse.redirect object)
  const cookiesToApply: Array<{
    name: string;
    value: string;
    options: Record<string, unknown>;
  }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
            cookiesToApply.push({ name, value, options });
          });
        },
      },
    }
  );

  const { data, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
    );
  }

  const user = data.user;
  const email = user?.email ?? "";

  if (!email.endsWith("@10minuteschool.com")) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        "Only @10minuteschool.com Google accounts are allowed."
      )}`
    );
  }

  const avatarUrl: string | null =
    user?.user_metadata?.avatar_url ??
    user?.user_metadata?.picture ??
    null;

  const displayName: string =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    email.split("@")[0];

  // Check if a profile row already exists for this email
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (!existingProfile) {
    // First-time Google sign-in — create the profile row
    await supabase.from("profiles").insert({
      id: user?.id,
      name: displayName,
      email,
      role: "Analyst",
      avatar_url: avatarUrl,
    });
  } else if (avatarUrl) {
    // Returning user — keep name/role intact, just sync the avatar
    await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("email", email);
  }

  // Redirect to ?next= if provided, otherwise home
  const next = searchParams.get("next");
  const destination = next ? `${origin}${next}` : `${origin}/`;
  const response = NextResponse.redirect(destination);
  cookiesToApply.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
  });

  return response;
}
