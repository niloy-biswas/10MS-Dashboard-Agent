import type { Dashboard } from "@/lib/types";
import { decryptSecret } from "@/lib/secrets/credentials-crypto";
import { adminGetDataSourceFullOptional, adminGetSetting } from "@/lib/supabase/admin-queries";
import { AnthropicModel, ModelProvider, OpenAIModel } from "../enums/model-names";

export interface ResolvedChatRuntime {
  llm: {
    provider: ModelProvider;
    apiKey: string;
    defaultModel: string;
  };
  bigQuery: {
    projectId: string;
    location: string;
    credentialsJson?: string;
  };
}

function parseProvider(v: string | null | undefined): ModelProvider {
  const p = (v ?? process.env.MODEL_PROVIDER ?? "anthropic").toLowerCase();
  if (p === "openai") return ModelProvider.OpenAI;
  return ModelProvider.Anthropic;
}

export async function resolveChatRuntime(dashboard: Dashboard): Promise<ResolvedChatRuntime> {
  const ai_provider = await adminGetSetting("ai_provider");
  const ai_model = await adminGetSetting("ai_model");
  const ai_key_enc = await adminGetSetting("ai_api_key_encrypted");

  const provider = parseProvider(ai_provider);

  let apiKey: string | undefined;
  if (ai_key_enc) {
    try {
      apiKey = decryptSecret(ai_key_enc);
    } catch {
      apiKey = undefined;
    }
  }
  if (!apiKey) {
    apiKey =
      provider === ModelProvider.Anthropic
        ? process.env.ANTHROPIC_API_KEY
        : process.env.OPENAI_API_KEY;
  }

  const defaultModel =
    ai_model ??
    (provider === ModelProvider.Anthropic
      ? process.env.ANTHROPIC_DEFAULT_MODEL ?? AnthropicModel.Sonnet4_5
      : process.env.OPENAI_DEFAULT_MODEL ?? OpenAIModel.GPT4o);

  if (!apiKey) {
    throw new Error(
      provider === ModelProvider.Anthropic
        ? "No Anthropic API key configured (Admin → Models or ANTHROPIC_API_KEY)"
        : "No OpenAI API key configured (Admin → Models or OPENAI_API_KEY)"
    );
  }

  let projectId = process.env.BIGQUERY_PROJECT ?? "tenms-userdb";
  let credentialsJson: string | undefined = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  let location = process.env.BIGQUERY_LOCATION ?? "US";

  if (dashboard.data_source_id) {
    const ds = await adminGetDataSourceFullOptional(dashboard.data_source_id);
    if (ds?.type === "bigquery") {
      projectId = ds.project_id;
      location = ds.location;
      if (ds.credentials_encrypted) {
        try {
          credentialsJson = decryptSecret(ds.credentials_encrypted);
        } catch {
          credentialsJson = undefined;
        }
      }
    }
  }

  return {
    llm: {
      provider,
      apiKey,
      defaultModel,
    },
    bigQuery: {
      projectId,
      location,
      credentialsJson,
    },
  };
}
