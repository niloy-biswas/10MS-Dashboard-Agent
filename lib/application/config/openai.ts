import { ChatOpenAI } from "@langchain/openai";
import { OpenAIModel } from "../enums/model-names";

export function createOpenAILLM(model?: string): ChatOpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new ChatOpenAI({
    model: model ?? process.env.OPENAI_DEFAULT_MODEL ?? OpenAIModel.GPT4o,
    apiKey: process.env.OPENAI_API_KEY,
    streaming: true,
  });
}