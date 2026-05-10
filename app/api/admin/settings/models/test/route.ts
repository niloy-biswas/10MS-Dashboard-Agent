import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-role";
import { adminGetSetting } from "@/lib/supabase/admin-queries";
import { decryptSecret } from "@/lib/secrets/credentials-crypto";
import { ModelProvider } from "@/lib/application/enums/model-names";
import { testLlmConnection } from "@/lib/admin/test-connections";

const schema = z.object({
  provider: z.enum(["anthropic", "openai"]),
  model: z.string().min(1),
  api_key: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = schema.parse(await req.json());
    const provider =
      body.provider === "openai" ? ModelProvider.OpenAI : ModelProvider.Anthropic;

    let apiKey = body.api_key?.trim();
    if (!apiKey) {
      const enc = await adminGetSetting("ai_api_key_encrypted");
      if (enc) {
        try {
          apiKey = decryptSecret(enc);
        } catch {
          return NextResponse.json({ error: "Could not decrypt stored API key" }, { status: 500 });
        }
      }
    }
    if (!apiKey) {
      apiKey =
        provider === ModelProvider.Anthropic
          ? process.env.ANTHROPIC_API_KEY
          : process.env.OPENAI_API_KEY;
    }
    if (!apiKey) {
      return NextResponse.json({ error: "No API key available to test" }, { status: 400 });
    }

    await testLlmConnection(provider, apiKey, body.model);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    const status = e instanceof Error && "status" in e ? (e as { status: number }).status : 500;
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: "Forbidden" }, { status });
    }
    const msg = e instanceof Error ? e.message : "Test failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
