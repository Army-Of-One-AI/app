import { WorkspaceMember } from "@/features/workspaces/types";
import { apiClient } from "@/shared/api/apiClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Project } from "../types";

export default function useRemoveMemberFromProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      workspaceSlug: string;
      projectSlug: string;
      targetUserId: string;
    }) => {
      const response = await apiClient.delete(
        `/workspaces/${params.workspaceSlug}/projects/${params.projectSlug}/members/${params.targetUserId}`
      );

      return response.data;
    },
    onMutate: async (params: {
      workspaceSlug: string;
      projectSlug: string;
      targetUserId: string;
    }) => {
      await queryClient.cancelQueries({
        queryKey: [
          "get-project-details-by-slug",
          params.projectSlug,
          params.workspaceSlug,
        ],
      });

      const prev = queryClient.getQueryData([
        "get-project-details-by-slug",
        params.projectSlug,
        params.workspaceSlug,
      ]);

      queryClient.setQueryData<Omit<Project, "taskCount">>(
        [
          "get-project-details-by-slug",
          params.projectSlug,
          params.workspaceSlug,
        ],
        (old) => {
          if (!old) return old;

          return {
            ...old,
            members: old.members.filter((m) => m.id !== params.targetUserId),
          };
        }
      );

      return { prev };
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
