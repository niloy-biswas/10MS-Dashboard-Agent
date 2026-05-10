import { BigQuery } from "@google-cloud/bigquery";
import { ModelProvider } from "@/lib/application/enums/model-names";

export async function testBigQueryConnection(opts: {
  projectId: string;
  credentialsJson?: string;
  location?: string;
}): Promise<void> {
  const location = opts.location ?? process.env.BIGQUERY_LOCATION ?? "US";
  let credentials: Record<string, unknown> | undefined;
  if (opts.credentialsJson) {
    try {
      credentials = JSON.parse(opts.credentialsJson) as Record<string, unknown>;
    } catch {
      throw new Error("Invalid service account JSON");
    }
  }
  const bq = new BigQuery({
    projectId: opts.projectId,
    location,
    credentials,
  });
  await bq.query({ query: "SELECT 1 AS ok", location });
}

export async function testLlmConnection(
  provider: ModelProvider,
  apiKey: string,
  model: string
): Promise<void> {
  if (provider === ModelProvider.Anthropic) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 8,
        messages: [{ role: "user", content: "ping" }],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t.slice(0, 400));
    }
    return;
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 8,
      messages: [{ role: "user", content: "ping" }],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t.slice(0, 400));
  }
}
