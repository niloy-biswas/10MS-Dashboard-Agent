import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-role";
import { adminGetSetting, adminUpsertSetting } from "@/lib/supabase/admin-queries";
import { encryptSecret, isEncryptionConfigured } from "@/lib/secrets/credentials-crypto";

const saveSchema = z.object({
  provider: z.enum(["anthropic", "openai"]),
  model: z.string().min(1),
  api_key: z.string().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const provider = await adminGetSetting("ai_provider");
    const model = await adminGetSetting("ai_model");
    const hasKey = Boolean(await adminGetSetting("ai_api_key_encrypted"));
    return NextResponse.json({
      provider: provider ?? process.env.MODEL_PROVIDER ?? "anthropic",
      model:
        model ??
        (provider === "openai"
          ? process.env.OPENAI_DEFAULT_MODEL
          : process.env.ANTHROPIC_DEFAULT_MODEL) ??
        "",
      has_api_key_stored: hasKey,
    });
  } catch (e) {
    const status = e instanceof Error && "status" in e ? (e as { status: number }).status : 500;
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: "Forbidden" }, { status });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to load model settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = saveSchema.parse(await req.json());

    await adminUpsertSetting("ai_provider", body.provider);
    await adminUpsertSetting("ai_model", body.model);

    if (body.api_key?.trim()) {
      if (!isEncryptionConfigured()) {
        return NextResponse.json(
          {
            error:
              "SETTINGS_ENCRYPTION_KEY is not set (min 16 chars). Required to store API keys.",
          },
          { status: 400 }
        );
      }
      const enc = encryptSecret(body.api_key.trim());
      await adminUpsertSetting("ai_api_key_encrypted", enc);
    }

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
    return NextResponse.json({ error: "Failed to save model settings" }, { status: 500 });
  }
}
