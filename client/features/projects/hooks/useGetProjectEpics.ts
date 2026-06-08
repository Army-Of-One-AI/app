import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/apiClient";
import { Epic } from "@/features/tasks/types";

export default function useGetProjectEpics(
  workspaceSlug: string,
  projectSlug: string
) {
  return useQuery({
    queryKey: ["get-project-epics", workspaceSlug, projectSlug],
    enabled: !!workspaceSlug && !!projectSlug,
    queryFn: async () => {
      const resp = await apiClient.get(
        `/workspaces/${workspaceSlug}/projects/${projectSlug}/epics`
      );
      return resp.data as Epic[];
    },
  });
}
