import { apiClient } from "@/shared/api/apiClient";
import { ProjectRole } from "@/shared/types/enums";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function useAddMemberToProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      workspaceSlug: string;
      projectSlug: string;
      targetUserId: string;
      role?: ProjectRole;
    }) => {
      const payload = {
        targetUserId: params.targetUserId,
        ...(params.role && {
          role: params.role,
        }),
      };

      const response = await apiClient.post(
        `/workspaces/${params.workspaceSlug}/projects/${params.projectSlug}/members`,
        payload,
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
