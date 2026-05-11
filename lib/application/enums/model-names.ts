export enum ModelProvider {
  Anthropic = "anthropic",
  OpenAI = "openai",
}

export enum AnthropicModel {
  Sonnet4_5 = "claude-sonnet-4-6",
  Opus4 = "claude-opus-4-5",
  Haiku4_5 = "claude-haiku-4-5",
}

/** GPT-5.x only — reasoning-style models (no legacy chat like gpt-4o-mini). */
export enum OpenAIModel {
  gpt5_5 = "gpt-5.5",
  gpt5_4 = "gpt-5.4",
  gpt5_2 = "gpt-5.2",
}

/** Admin UI + validation: one row per selectable model. */
export const ANTHROPIC_MODEL_CHOICES: ReadonlyArray<{ value: AnthropicModel; label: string }> = [
  { value: AnthropicModel.Sonnet4_5, label: "Claude Sonnet 4.6" },
  { value: AnthropicModel.Opus4, label: "Claude Opus 4.5" },
  { value: AnthropicModel.Haiku4_5, label: "Claude Haiku 4.5" },
];

export const OPENAI_MODEL_CHOICES: ReadonlyArray<{ value: OpenAIModel; label: string }> = [
  { value: OpenAIModel.gpt5_5, label: "GPT-5.5" },
  { value: OpenAIModel.gpt5_4, label: "GPT-5.4" },
  { value: OpenAIModel.gpt5_2, label: "GPT-5.2" },
];

const ANTHROPIC_MODEL_IDS = new Set<string>(ANTHROPIC_MODEL_CHOICES.map((c) => c.value));
const OPENAI_MODEL_IDS = new Set<string>(OPENAI_MODEL_CHOICES.map((c) => c.value));

function isAnthropicModelId(id: string): boolean {
  return ANTHROPIC_MODEL_IDS.has(id);
}

function isOpenAiModelId(id: string): boolean {
  return OPENAI_MODEL_IDS.has(id);
}

export function isValidModelForProvider(provider: ModelProvider, modelId: string): boolean {
  return provider === ModelProvider.Anthropic
    ? isAnthropicModelId(modelId)
    : isOpenAiModelId(modelId);
}