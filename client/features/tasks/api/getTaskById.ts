import { apiClient } from "@/shared/api/apiClient";
import { Task } from "../types";

export const getTaskById = async (
  taskId: string,
  projectSlug: string,
  workspaceSlug: string,
) => {
  const response = await apiClient.get(
    `/workspaces/${workspaceSlug}/projects/${projectSlug}/tasks/${taskId}`,
  );
  return response.data as Task;
};
