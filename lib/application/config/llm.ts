import { createAnthropicLLM } from "./anthropic";
import { createOpenAILLM } from "./openai";
import { ModelProvider } from "../enums/model-names";

export interface LlmRuntimeConfig {
  provider: ModelProvider;
  apiKey: string;
  defaultModel: string;
}

export function createLLM(model: string | undefined, runtime: LlmRuntimeConfig) {
  switch (runtime.provider) {
    case ModelProvider.Anthropic:
      return createAnthropicLLM(model ?? runtime.defaultModel, runtime.apiKey);
    case ModelProvider.OpenAI:
      return createOpenAILLM(model ?? runtime.defaultModel, runtime.apiKey);
    default:
      throw new Error(
        `Unknown MODEL_PROVIDER: "${runtime.provider}". Must be "anthropic" or "openai".`
      );
  }
}