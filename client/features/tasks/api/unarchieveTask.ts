import { apiClient } from "@/shared/api/apiClient";

export const unarchiveTask = async (
  taskId: string,
  workspaceSlug: string,
  projectSlug: string
) => {
  const response = await apiClient.put(
    `/workspaces/${workspaceSlug}/projects/${projectSlug}/tasks/${taskId}/unarchive`
  );
  return response.data;
};