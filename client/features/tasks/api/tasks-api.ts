import apiClient from "@/shared/api/api-client";
import type {
  CreateTaskCommentInput,
  CreateTaskInput,
  MoveTaskInput,
  Task,
  TaskComment,
  UpdateTaskInput,
} from "../types";

export async function getTasks(filters: {
  projectId?: string;
  boardId?: string;
  columnId?: string;
}) {
  const response = await apiClient.get<Task[]>("/tasks", { params: filters });
  return response.data;
}

export async function getTask(id: string) {
  const response = await apiClient.get<Task>(`/tasks/${id}`);
  return response.data;
}

export async function createTask(input: CreateTaskInput) {
  const response = await apiClient.post<Task>("/tasks", input);
  return response.data;
}

export async function updateTask(id: string, input: UpdateTaskInput) {
  const response = await apiClient.patch<Task>(`/tasks/${id}`, input);
  return response.data;
}

export async function moveTask(id: string, input: MoveTaskInput) {
  const response = await apiClient.patch<Task>(`/tasks/${id}/move`, input);
  return response.data;
}

export async function getTaskComments(taskId: string) {
  const response = await apiClient.get<TaskComment[]>(`/tasks/${taskId}/comments`);
  return response.data;
}

export async function createTaskComment(taskId: string, input: CreateTaskCommentInput) {
  const response = await apiClient.post<TaskComment>(`/tasks/${taskId}/comments`, input);
  return response.data;
}
