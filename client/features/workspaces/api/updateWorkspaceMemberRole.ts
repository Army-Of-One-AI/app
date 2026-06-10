import { apiClient } from "@/shared/api/apiClient";
import { WorkspaceRole } from "@/shared/types/enums";

export const updateWorkspaceMemberRole = async (
  workspaceSlug: string,
  memberId: string,
  role: WorkspaceRole
) => {
  const resp = await apiClient.put(
    `/workspaces/${workspaceSlug}/members/${memberId}`,
    { role }
  );

  return resp.data;
};
