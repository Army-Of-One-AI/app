import { apiClient } from "@/shared/api/apiClient";

export const archiveTask = async (
  taskId: string,
  workspaceSlug: string,
  projectSlug: string
) => {
  const response = await apiClient.put(
    `/workspaces/${workspaceSlug}/projects/${projectSlug}/tasks/${taskId}/archive`
  );
  return response.data;
};