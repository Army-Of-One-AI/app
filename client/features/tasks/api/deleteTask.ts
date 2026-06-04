import { apiClient } from "@/shared/api/apiClient";

export const deleteTask = async (
  taskId: string,
  workspaceSlug: string,
  projectSlug: string
) => {
  const response = await apiClient.delete(
    `/workspaces/${workspaceSlug}/projects/${projectSlug}/tasks/${taskId}`
  );
  return response.data;
};
