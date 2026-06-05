// features/tasks/api/createTask.ts

import { CreateTaskFormValues } from "@/app/[workspaceSlug]/(dashboard-layout)/projects/[projectSlug]/board/components/CreateTaskModal";
import { apiClient } from "@/shared/api/apiClient";

export async function createTask(
  workspaceSlug: string,
  projectSlug: string,
  payload: CreateTaskFormValues
) {
  const { data } = await apiClient.post(
    `/workspaces/${workspaceSlug}/projects/${projectSlug}/tasks`,
    payload
  );

  return data;
}
