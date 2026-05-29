import apiClient from "@/shared/api/api-client";
import type { Board } from "../types";

export async function getBoardsByProject(projectId: string) {
  const response = await apiClient.get<Board[]>(`/boards/project/${projectId}`);
  return response.data;
}

export async function getBoard(id: string) {
  const response = await apiClient.get<Board>(`/boards/${id}`);
  return response.data;
}
