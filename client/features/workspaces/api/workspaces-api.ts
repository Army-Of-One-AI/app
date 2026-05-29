import apiClient from "@/shared/api/api-client";
import type { CreateWorkspaceInput, UpdateWorkspaceInput, Workspace } from "../types";

export async function getWorkspaces() {
  const response = await apiClient.get<Workspace[]>("/workspaces");
  return response.data;
}

export async function getWorkspace(id: string) {
  const response = await apiClient.get<Workspace>(`/workspaces/${id}`);
  return response.data;
}

export async function createWorkspace(input: CreateWorkspaceInput) {
  const response = await apiClient.post<Workspace>("/workspaces", input);
  return response.data;
}

export async function updateWorkspace(id: string, input: UpdateWorkspaceInput) {
  const response = await apiClient.patch<Workspace>(`/workspaces/${id}`, input);
  return response.data;
}

export async function deleteWorkspace(id: string) {
  const response = await apiClient.delete<Workspace>(`/workspaces/${id}`);
  return response.data;
}
