export type ModelProviderType = "OLLAMA" | "OPENAI" | "ANTHROPIC" | "GEMINI" | "LOCAL";

export type ModelProvider = {
  id: string;
  name: string;
  type: ModelProviderType;
  base_url: string | null;
  model_name: string;
  created_at: string;
  updated_at: string;
};

export type CreateModelProviderInput = {
  name: string;
  type: ModelProviderType;
  baseUrl?: string;
  modelName: string;
  apiKey?: string;
};
