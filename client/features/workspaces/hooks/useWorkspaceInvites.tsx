import { apiClient } from "@/shared/api/apiClient";
import { useQuery } from "@tanstack/react-query";
import { WorkspaceInvite } from "../types";

export default function useWorkspaceInvites(workspaceSlug: string) {
  return useQuery({
    queryKey: ["get-workspace-invites", workspaceSlug],
    queryFn: async () => {
      const resp = await apiClient.get(`/workspaces/${workspaceSlug}/invites`);
      return resp.data as WorkspaceInvite[];
    },
  });
}
