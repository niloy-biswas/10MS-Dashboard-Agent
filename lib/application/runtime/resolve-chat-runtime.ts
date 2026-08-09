import type { Dashboard } from "@/lib/types";
import {
  adminDecryptDataSourceCredentials,
  adminGetDataSourceFullOptional,
  adminGetDefaultBigQueryDataSourceOptional,
  adminGetSetting,
  type DataSourceRow,
} from "@/lib/supabase/admin-queries";
import { AnthropicModel, ModelProvider, OPENAI_MODEL_CHOICES } from "../enums/model-names";
import { resolveLlmApiKeyFromSettings } from "./llm-api-key-from-settings";

export interface ResolvedChatRuntime {
  llm: {
    provider: ModelProvider;
    apiKey: string;
    defaultModel: string;
  };
  bigQuery: {
    projectId: string;
    location: string;
    credentialsJson: string;
  };
}

function parseProvider(v: string | null | undefined): ModelProvider {
  const p = (v ?? process.env.MODEL_PROVIDER ?? "anthropic").toLowerCase();
  if (p === "openai") return ModelProvider.OpenAI;
  return ModelProvider.Anthropic;
}

async function resolveBigQueryFromAdmin(dashboard: Dashboard): Promise<{
  projectId: string;
  location: string;
  credentialsJson: string;
} | null> {
  let ds: DataSourceRow | null = null;

  if (dashboard.data_source_id) {
    ds = await adminGetDataSourceFullOptional(dashboard.data_source_id);
    if (!ds) {
      throw new Error(
        "Dashboard data source could not be loaded. Ensure SUPABASE_SERVICE_ROLE_KEY is set and the source still exists."
      );
    }
    if (ds.type !== "bigquery") {
      throw new Error(`Dashboard data source "${ds.label}" is not a BigQuery source.`);
    }
  } else {
    // Prefer the admin-connected source over env when the dashboard has none assigned.
    ds = await adminGetDefaultBigQueryDataSourceOptional();
  }

  if (!ds) return null;

  return {
    projectId: ds.project_id,
    location: ds.location,
    credentialsJson: adminDecryptDataSourceCredentials(ds),
  };
}

export async function resolveChatRuntime(dashboard: Dashboard): Promise<ResolvedChatRuntime> {
  const ai_provider = await adminGetSetting("ai_provider");
  const ai_model = await adminGetSetting("ai_model");

  const provider = parseProvider(ai_provider);

  let apiKey = await resolveLlmApiKeyFromSettings(provider);
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
      : process.env.OPENAI_DEFAULT_MODEL ?? OPENAI_MODEL_CHOICES[0]!.value);

  if (!apiKey) {
    throw new Error(
      provider === ModelProvider.Anthropic
        ? "No Anthropic API key configured (Admin → Models or ANTHROPIC_API_KEY)"
        : "No OpenAI API key configured (Admin → Models or OPENAI_API_KEY)"
    );
  }

  const fromAdmin = await resolveBigQueryFromAdmin(dashboard);
  const credentialsJson =
    fromAdmin?.credentialsJson ?? process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();
  const projectId = fromAdmin?.projectId ?? process.env.BIGQUERY_PROJECT ?? "tenms-userdb";
  const location = fromAdmin?.location ?? process.env.BIGQUERY_LOCATION ?? "US";

  if (!credentialsJson) {
    throw new Error(
      "No BigQuery credentials available. Add a Connected source in Admin (or set GOOGLE_APPLICATION_CREDENTIALS_JSON)."
    );
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
