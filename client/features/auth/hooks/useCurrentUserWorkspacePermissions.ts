import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/apiClient";
import { CurrentWorkspaceUserPermissions } from "@/shared/types/types";

export default function useCurrentUserWorkspacePermissions(wsSlug: string) {
  return useQuery({
    enabled: !!wsSlug,
    queryKey: ["get-current-user-workspace-permissions", wsSlug],
    queryFn: async () => {
      const resp = await apiClient.get(`/workspaces/${wsSlug}/me/permissions`);
      return resp.data as CurrentWorkspaceUserPermissions;
    },
  });
}
