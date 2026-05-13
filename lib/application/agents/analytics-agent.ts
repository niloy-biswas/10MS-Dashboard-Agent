import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { createLLM } from "../config/llm";
import { createBigQueryTools } from "../config/bigquery-tools";
import { buildSystemPrompt } from "../prompts/analytics-prompt";
import type { ResolvedChatRuntime } from "../runtime/resolve-chat-runtime";
import type { ChatPayload } from "@/lib/types";

export async function createAnalyticsAgent(payload: ChatPayload, runtime: ResolvedChatRuntime) {
  const llm = createLLM(payload.model, runtime.llm);
  const tools = createBigQueryTools(runtime.bigQuery);

  return createReactAgent({
    llm,
    tools,
    prompt: buildSystemPrompt(payload),
  });
}