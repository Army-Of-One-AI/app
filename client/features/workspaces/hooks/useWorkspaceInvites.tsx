import { apiClient } from "@/shared/api/apiClient";
import { useQuery } from "@tanstack/react-query";
import { WorkspaceInvite } from "../types";

export default function useWorkspaceInvites(
  workspaceSlug: string,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: ["get-workspace-invites", workspaceSlug],
    enabled: !!workspaceSlug && (options.enabled ?? true),
    queryFn: async () => {
      const resp = await apiClient.get(`/workspaces/${workspaceSlug}/invites`);
      return resp.data as WorkspaceInvite[];
    },
  });
}
