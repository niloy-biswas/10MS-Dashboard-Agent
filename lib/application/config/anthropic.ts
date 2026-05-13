import { ChatAnthropic } from "@langchain/anthropic";
import { AnthropicModel } from "../enums/model-names";

export function createAnthropicLLM(model?: string, apiKeyOverride?: string): ChatAnthropic {
  const apiKey = apiKeyOverride ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  return new ChatAnthropic({
    model: model ?? process.env.ANTHROPIC_DEFAULT_MODEL ?? AnthropicModel.Sonnet4_5,
    apiKey,
    streaming: true,
  });
}