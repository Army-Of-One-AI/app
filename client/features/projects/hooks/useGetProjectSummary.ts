import { apiClient } from "@/shared/api/apiClient";
import { useQuery } from "@tanstack/react-query";

export default function useGetProjectSummary(
  projectSlug: string,
  workspaceSlug: string
) {
  return useQuery({
    queryKey: ["get-project-summary", projectSlug, workspaceSlug],
    enabled: !!projectSlug && !!workspaceSlug,
    queryFn: async () => {
      const resp = await apiClient.get(
        `/workspaces/${workspaceSlug}/projects/${projectSlug}/summary`
      );
      return resp.data;
    },
  });
}
