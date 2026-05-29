import apiClient from "@/shared/api/api-client";
import type { AgentRun, CreateAgentRunInput } from "../types";

export async function getAgentRuns(filters: { taskId?: string; agentId?: string }) {
  const response = await apiClient.get<AgentRun[]>("/agent-runs", {
    params: filters,
  });
  return response.data;
}

export async function createAgentRun(input: CreateAgentRunInput) {
  const response = await apiClient.post<AgentRun>("/agent-runs", input);
  return response.data;
}
