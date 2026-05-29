import apiClient from "@/shared/api/api-client";
import type { CreateProjectInput, Project } from "../types";

export async function getProjects(workspaceId: string) {
  const response = await apiClient.get<Project[]>("/projects", {
    params: { workspaceId },
  });
  return response.data;
}

export async function getAllProjects() {
  const response = await apiClient.get<Project[]>("/projects");
  return response.data;
}

export async function getProject(id: string) {
  const response = await apiClient.get<Project>(`/projects/${id}`);
  return response.data;
}

export async function createProject(input: CreateProjectInput) {
  const response = await apiClient.post<Project>("/projects", input);
  return response.data;
}
