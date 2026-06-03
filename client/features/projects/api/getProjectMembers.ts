import { apiClient } from "@/shared/api/apiClient";
import { ProjectMember } from "../types";

export const getProjectMembers = async (
  projectSlug: string,
  workspaceSlug: string,
) => {
  const response = await apiClient.get(
    `/workspaces/${workspaceSlug}/projects/${projectSlug}/members`,
  );

  return response.data as ProjectMember[];
};
