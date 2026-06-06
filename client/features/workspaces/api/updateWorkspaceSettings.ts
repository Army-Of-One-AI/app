import { apiClient } from "@/shared/api/apiClient";
import { UpdateWorkspaceSettingsPayload } from "../types";

export const updateWorkspaceSettings = async (
  workspaceSlug: string,
  payload: UpdateWorkspaceSettingsPayload
) => {
  const resp = await apiClient.patch(
    `/workspaces/${workspaceSlug}/settings`,
    payload
  );
  return resp.data;
};
