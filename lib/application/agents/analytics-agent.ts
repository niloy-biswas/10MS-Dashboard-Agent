import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { createLLM } from "../config/llm";
import { bigQueryTools } from "../config/bigquery-tools";
import { buildSystemPrompt } from "../prompts/analytics-prompt";
import type { ChatPayload } from "@/lib/types";

export async function createAnalyticsAgent(payload: ChatPayload) {
  const llm = createLLM(payload.model);

  return createReactAgent({
    llm,
    tools: bigQueryTools,
    prompt: buildSystemPrompt(payload),
  });
}