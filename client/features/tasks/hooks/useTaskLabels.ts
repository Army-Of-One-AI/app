import { apiClient } from "@/shared/api/apiClient";
import { useQuery } from "@tanstack/react-query";
import { TaskLabel } from "../types";

export default function useTaskLabels(
  workspaceSlug: string,
  projectSlug: string,
) {
  return useQuery({
    queryKey: ["get-task-labels", workspaceSlug, projectSlug],
    enabled: !!workspaceSlug && !!projectSlug,
    queryFn: async () => {
      const resp = await apiClient.get(
        `/workspaces/${workspaceSlug}/projects/${projectSlug}/labels`,
      );
      return resp.data as TaskLabel[];
    },
  });
}
