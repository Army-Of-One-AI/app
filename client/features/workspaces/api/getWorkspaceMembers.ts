import { apiClient } from "@/shared/api/apiClient";
import { WorkspaceMember } from "../types";

export const getWorkspaceMembers = async (workspaceSlug: string) => {
  const resp = await apiClient.get(`/workspaces/${workspaceSlug}/members`);
  return resp.data as WorkspaceMember[];
};
