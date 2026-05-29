import apiClient from "@/shared/api/api-client";
import type { AgentRole, CreateAgentRoleInput } from "../types";

export async function getAgentRoles(workspaceId: string) {
  const response = await apiClient.get<AgentRole[]>("/agent-roles", {
    params: { workspaceId },
  });
  return response.data;
}

export async function createAgentRole(input: CreateAgentRoleInput) {
  const response = await apiClient.post<AgentRole>("/agent-roles", input);
  return response.data;
}
