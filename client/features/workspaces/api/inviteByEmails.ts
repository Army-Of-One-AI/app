import { apiClient } from "@/shared/api/apiClient";

export const inviteByEmails = async (
  workspaceSlug: string,
  emails: string[]
) => {
  const response = await apiClient.post(
    `/workspaces/${workspaceSlug}/invites`,
    {
      emails,
    }
  );
  return response.data;
};
