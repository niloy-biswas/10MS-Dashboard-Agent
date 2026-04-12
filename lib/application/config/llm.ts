import { createAnthropicLLM } from "./anthropic";
import { createOpenAILLM } from "./openai";
import { ModelProvider } from "../enums/model-names";

export function createLLM(model?: string) {
  const provider = process.env.MODEL_PROVIDER as ModelProvider;

  switch (provider) {
    case ModelProvider.Anthropic:
      return createAnthropicLLM(model);
    case ModelProvider.OpenAI:
      return createOpenAILLM(model);
    default:
      throw new Error(
        `Unknown MODEL_PROVIDER: "${provider}". Must be "anthropic" or "openai".`
      );
  }
}