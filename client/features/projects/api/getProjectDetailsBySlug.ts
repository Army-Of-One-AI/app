import { apiClient } from "@/shared/api/apiClient";
import { Project } from "../types";

export const getProjectDetailsBySlug = async (
  projectSlug: string,
  workspaceSlug: string
) => {
  const response = await apiClient.get(
    `/workspaces/${workspaceSlug}/projects/${projectSlug}`
  );

  return response.data as Omit<Project, "members" | "taskCount">;
};
