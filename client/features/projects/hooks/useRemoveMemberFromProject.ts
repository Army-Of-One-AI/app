import { apiClient } from "@/shared/api/apiClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function useRemoveMemberFromProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      workspaceSlug: string;
      projectSlug: string;
      targetUserId: string;
    }) => {
      const response = await apiClient.delete(
        `/workspaces/${params.workspaceSlug}/projects/${params.projectSlug}/members/${params.targetUserId}`,
      );

      return response.data;
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({
        queryKey: [
          "get-project-details-by-slug",
          params.projectSlug,
          params.workspaceSlug,
        ],
      });
    },
  });
}
