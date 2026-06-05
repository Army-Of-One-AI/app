import { apiClient } from "@/shared/api/apiClient";
import { GetTaskActivitiesParams, TaskActivitiesResponse } from "../types";

export const getTaskActivities = async (params: GetTaskActivitiesParams) => {
  const { workspaceSlug, projectSlug, taskId, cursor, limit } = params;

  const resp = await apiClient.get(
    `/workspaces/${workspaceSlug}/projects/${projectSlug}/tasks/${taskId}/activities`,
    {
      params: {
        ...(cursor && { cursor }),
        ...(limit && { limit }),
      },
    }
  );

  return resp.data as TaskActivitiesResponse;
};
