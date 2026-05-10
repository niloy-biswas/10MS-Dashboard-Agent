import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-role";
import { adminGetSetting, adminUpsertSetting } from "@/lib/supabase/admin-queries";

const putSchema = z.object({
  allowed_email_domain: z.string().min(1),
});

export async function GET() {
  try {
    await requireAdmin();
    const domain =
      (await adminGetSetting("allowed_email_domain")) ??
      process.env.ALLOWED_EMAIL_DOMAIN ??
      "*";
    return NextResponse.json({ allowed_email_domain: domain });
  } catch (e) {
    const status = e instanceof Error && "status" in e ? (e as { status: number }).status : 500;
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: "Forbidden" }, { status });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to load auth settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const body = putSchema.parse(await req.json());
    await adminUpsertSetting("allowed_email_domain", body.allowed_email_domain.trim());
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    const status = e instanceof Error && "status" in e ? (e as { status: number }).status : 500;
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: "Forbidden" }, { status });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to save auth settings" }, { status: 500 });
  }
}
