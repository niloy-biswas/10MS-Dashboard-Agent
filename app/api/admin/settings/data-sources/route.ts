import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-role";
import { adminInsertBigQueryDataSource, adminListDataSources } from "@/lib/supabase/admin-queries";
import { isEncryptionConfigured } from "@/lib/secrets/credentials-crypto";
import { testBigQueryConnection } from "@/lib/admin/test-connections";

const createSchema = z.object({
  label: z.string().min(1),
  project_id: z.string().min(1),
  location: z.string().trim().min(1).default("US"),
  credentials_json: z.string().min(2),
});

export async function GET() {
  try {
    await requireAdmin();
    const list = await adminListDataSources();
    return NextResponse.json({ data_sources: list });
  } catch (e) {
    const status = e instanceof Error && "status" in e ? (e as { status: number }).status : 500;
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: "Forbidden" }, { status });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to list data sources" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!isEncryptionConfigured()) {
      return NextResponse.json(
        {
          error:
            "SETTINGS_ENCRYPTION_KEY is not set (min 16 chars). Required to store credentials securely.",
        },
        { status: 400 }
      );
    }
    const body = createSchema.parse(await req.json());
    await testBigQueryConnection({
      projectId: body.project_id,
      location: body.location,
      credentialsJson: body.credentials_json,
    });
    const id = await adminInsertBigQueryDataSource({
      label: body.label,
      project_id: body.project_id,
      location: body.location,
      credentials_json: body.credentials_json,
      created_by: session.userId,
    });
    return NextResponse.json({ id });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    const status = e instanceof Error && "status" in e ? (e as { status: number }).status : 500;
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: "Forbidden" }, { status });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to create data source" }, { status: 500 });
  }
}
