import { useQuery } from "@tanstack/react-query";
import { getWorkspaceMembers } from "../api/getWorkspaceMembers";

export default function useWorkspaceMembers(workspaceSlug: string) {
  return useQuery({
    queryKey: ["get-workspace-members", workspaceSlug],
    enabled: !!workspaceSlug,
    queryFn: async () => {
      return await getWorkspaceMembers(workspaceSlug);
    },
  });
}
