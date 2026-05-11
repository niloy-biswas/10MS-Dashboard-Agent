import { decryptSecret } from "@/lib/secrets/credentials-crypto";
import { adminGetSetting } from "@/lib/supabase/admin-queries";
import { ModelProvider } from "../enums/model-names";

/**
 * Encrypted blob for the LLM API key for this provider.
 * Anthropic: `anthropic_api_key_encrypted` then legacy `ai_api_key_encrypted`.
 * OpenAI: `openai_api_key_encrypted` only (legacy single column may hold the wrong provider’s key).
 */
export async function getEncryptedLlmApiKeyBlobForProvider(
  provider: ModelProvider
): Promise<string | null> {
  if (provider === ModelProvider.Anthropic) {
    return (
      (await adminGetSetting("anthropic_api_key_encrypted")) ??
      (await adminGetSetting("ai_api_key_encrypted"))
    );
  }
  return (await adminGetSetting("openai_api_key_encrypted")) ?? null;
}

export async function resolveLlmApiKeyFromSettings(
  provider: ModelProvider
): Promise<string | undefined> {
  const enc = await getEncryptedLlmApiKeyBlobForProvider(provider);
  if (!enc) return undefined;
  try {
    return decryptSecret(enc);
  } catch {
    return undefined;
  }
}

export function llmApiKeyAppSettingKey(
  provider: ModelProvider
): "anthropic_api_key_encrypted" | "openai_api_key_encrypted" {
  return provider === ModelProvider.Anthropic
    ? "anthropic_api_key_encrypted"
    : "openai_api_key_encrypted";
}
