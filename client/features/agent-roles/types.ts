import type { ModelProvider } from "@/features/model-providers/types";

export type AgentRoleType = "PRODUCT_OWNER" | "PM" | "DESIGNER" | "DEVELOPER" | "QC";

export type AgentRole = {
  id: string;
  workspace_id: string;
  name: string;
  role: AgentRoleType;
  description: string | null;
  system_prompt: string;
  model_provider_id: string | null;
  created_at: string;
  updated_at: string;
  model_provider?: ModelProvider | null;
};

export type CreateAgentRoleInput = {
  workspaceId: string;
  name: string;
  role: AgentRoleType;
  description?: string;
  systemPrompt: string;
  modelProviderId?: string;
};
