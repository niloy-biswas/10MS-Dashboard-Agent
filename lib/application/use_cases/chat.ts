import { streamAgentResponse } from "../orchestrators/chat-orchestrator";
import type { ChatPayload } from "@/lib/types";

export async function runChatUseCase(payload: ChatPayload): Promise<ReadableStream> {
  return streamAgentResponse(payload);
}