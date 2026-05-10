import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-role";
import { testBigQueryConnection } from "@/lib/admin/test-connections";

const testSchema = z.object({
  project_id: z.string().trim().min(1),
  location: z.string().trim().min(1).default("US"),
  credentials_json: z.string().min(2),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = testSchema.parse(await req.json());
    await testBigQueryConnection({
      projectId: body.project_id,
      location: body.location,
      credentialsJson: body.credentials_json,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    const status = e instanceof Error && "status" in e ? (e as { status: number }).status : 500;
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: "Forbidden" }, { status });
    }
    const msg = e instanceof Error ? e.message : "Connection test failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
