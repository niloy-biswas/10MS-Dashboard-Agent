import { ChatOpenAI } from "@langchain/openai";
import { OPENAI_MODEL_CHOICES } from "../enums/model-names";

export function createOpenAILLM(model?: string, apiKeyOverride?: string): ChatOpenAI {
  const apiKey = apiKeyOverride ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new ChatOpenAI({
    model: model ?? process.env.OPENAI_DEFAULT_MODEL ?? OPENAI_MODEL_CHOICES[0]!.value,
    apiKey,
    streaming: true,
  });
}