import { apiClient } from "@/shared/api/apiClient";

export const deleteWorkspace = async (workspaceSlug: string) => {
  const response = await apiClient.delete(`/workspaces/${workspaceSlug}`);
  return response.data;
};
