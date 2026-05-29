import apiClient from "@/shared/api/api-client";
import type { CreateModelProviderInput, ModelProvider } from "../types";

export async function getModelProviders() {
  const response = await apiClient.get<ModelProvider[]>("/model-providers");
  return response.data;
}

export async function createModelProvider(input: CreateModelProviderInput) {
  const response = await apiClient.post<ModelProvider>("/model-providers", input);
  return response.data;
}
