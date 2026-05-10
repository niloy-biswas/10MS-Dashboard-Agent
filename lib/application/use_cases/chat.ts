import { streamAgentResponse } from "../orchestrators/chat-orchestrator";
import type { ResolvedChatRuntime } from "../runtime/resolve-chat-runtime";
import type { ChatPayload } from "@/lib/types";

export async function runChatUseCase(
  payload: ChatPayload,
  runtime: ResolvedChatRuntime
): Promise<ReadableStream> {
  return streamAgentResponse(payload, runtime);
}