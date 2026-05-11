import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-role";
import { adminGetSetting, adminUpsertSetting } from "@/lib/supabase/admin-queries";
import { encryptSecret, isEncryptionConfigured } from "@/lib/secrets/credentials-crypto";
import { ModelProvider, isValidModelForProvider } from "@/lib/application/enums/model-names";
import {
  getEncryptedLlmApiKeyBlobForProvider,
  llmApiKeyAppSettingKey,
} from "@/lib/application/runtime/llm-api-key-from-settings";

function toModelProvider(p: string | null | undefined): ModelProvider {
  return p === "openai" ? ModelProvider.OpenAI : ModelProvider.Anthropic;
}

const saveSchema = z
  .object({
    provider: z.enum(["anthropic", "openai"]),
    model: z.string().min(1),
    /** @deprecated Prefer anthropic_api_key / openai_api_key so both providers can be configured at once. */
    api_key: z.string().optional(),
    anthropic_api_key: z.string().optional(),
    openai_api_key: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const p = data.provider === "openai" ? ModelProvider.OpenAI : ModelProvider.Anthropic;
    if (!isValidModelForProvider(p, data.model)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Model must be one of the options for the selected provider",
        path: ["model"],
      });
    }
  });

export async function GET() {
  try {
    await requireAdmin();
    const providerRaw = await adminGetSetting("ai_provider");
    const model = await adminGetSetting("ai_model");
    const providerEnum = toModelProvider(providerRaw ?? process.env.MODEL_PROVIDER);
    const hasAnthropic = Boolean(await getEncryptedLlmApiKeyBlobForProvider(ModelProvider.Anthropic));
    const hasOpenai = Boolean(await getEncryptedLlmApiKeyBlobForProvider(ModelProvider.OpenAI));
    const hasKey = Boolean(await getEncryptedLlmApiKeyBlobForProvider(providerEnum));
    return NextResponse.json({
      provider: providerRaw ?? process.env.MODEL_PROVIDER ?? "anthropic",
      model:
        model ??
        (providerEnum === ModelProvider.OpenAI
          ? process.env.OPENAI_DEFAULT_MODEL
          : process.env.ANTHROPIC_DEFAULT_MODEL) ??
        "",
      has_api_key_stored: hasKey,
      has_anthropic_api_key_stored: hasAnthropic,
      has_openai_api_key_stored: hasOpenai,
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

    const keyAnth = body.anthropic_api_key?.trim();
    const keyOpen = body.openai_api_key?.trim();
    const keyLegacy = body.api_key?.trim();
    const needsEncryption = Boolean(keyAnth || keyOpen || keyLegacy);

    if (needsEncryption && !isEncryptionConfigured()) {
      return NextResponse.json(
        {
          error:
            "SETTINGS_ENCRYPTION_KEY is not set (min 16 chars). Required to store API keys.",
        },
        { status: 400 }
      );
    }

    if (keyAnth) {
      await adminUpsertSetting("anthropic_api_key_encrypted", encryptSecret(keyAnth));
    }
    if (keyOpen) {
      await adminUpsertSetting("openai_api_key_encrypted", encryptSecret(keyOpen));
    }
    if (keyLegacy && !keyAnth && !keyOpen) {
      const p = body.provider === "openai" ? ModelProvider.OpenAI : ModelProvider.Anthropic;
      await adminUpsertSetting(llmApiKeyAppSettingKey(p), encryptSecret(keyLegacy));
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
