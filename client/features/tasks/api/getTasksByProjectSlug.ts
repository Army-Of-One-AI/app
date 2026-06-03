import { apiClient } from "@/shared/api/apiClient";
import { Task } from "../types";
import { CurrentProjectUser } from "@/shared/types/types";

export const getTasksByProjectSlug = async (
  projectSlug: string,
  workspaceSlug: string
) => {
  const response = await apiClient.get(
    `/workspaces/${workspaceSlug}/projects/${projectSlug}/tasks`
  );
  return response.data as { tasks: Task[]; currentUser: CurrentProjectUser };
};
