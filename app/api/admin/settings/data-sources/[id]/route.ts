import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-role";
import {
  adminDeleteDataSource,
  adminGetDataSourceFull,
  adminUpdateBigQueryDataSource,
} from "@/lib/supabase/admin-queries";
import { decryptSecret, isEncryptionConfigured } from "@/lib/secrets/credentials-crypto";
import { testBigQueryConnection } from "@/lib/admin/test-connections";

const updateSchema = z.object({
  label: z.string().trim().min(1),
  project_id: z.string().trim().min(1),
  location: z.string().trim().min(1),
  credentials_json: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = updateSchema.parse(await req.json());

    if (body.credentials_json?.trim() && !isEncryptionConfigured()) {
      return NextResponse.json(
        {
          error:
            "SETTINGS_ENCRYPTION_KEY is not set (min 16 chars). Required to store credentials securely.",
        },
        { status: 400 }
      );
    }

    let credentialsJson = body.credentials_json?.trim();
    if (!credentialsJson) {
      const existing = await adminGetDataSourceFull(id);
      if (!existing?.credentials_encrypted) {
        return NextResponse.json(
          { error: "No stored credentials found. Paste service account JSON before saving." },
          { status: 400 }
        );
      }
      credentialsJson = decryptSecret(existing.credentials_encrypted);
    }

    await testBigQueryConnection({
      projectId: body.project_id,
      location: body.location,
      credentialsJson,
    });

    await adminUpdateBigQueryDataSource({
      id,
      label: body.label,
      project_id: body.project_id,
      location: body.location,
      credentials_json: body.credentials_json?.trim() || undefined,
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
    console.error(e);
    return NextResponse.json({ error: "Failed to update data source" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;
    await adminDeleteDataSource(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to delete";
    const status = e instanceof Error && "status" in e ? (e as { status: number }).status : 500;
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: "Forbidden" }, { status });
    }
    if (msg.includes("Cannot delete")) {
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
