import { apiClient } from "@/shared/api/apiClient";
import { ProjectRole } from "@/shared/types/enums";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Project } from "../types";
import { WorkspaceMember } from "@/features/workspaces/types";

export default function useAddMemberToProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      workspaceSlug: string;
      projectSlug: string;
      targetUser: WorkspaceMember;
      role?: ProjectRole;
    }) => {
      const payload = {
        targetUserId: params.targetUser.id,
        ...(params.role && {
          role: params.role,
        }),
      };

      const response = await apiClient.post(
        `/workspaces/${params.workspaceSlug}/projects/${params.projectSlug}/members`,
        payload
      );

      return response.data;
    },
    onMutate: async (params: {
      workspaceSlug: string;
      projectSlug: string;
      targetUser: WorkspaceMember;
      role?: ProjectRole;
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
            members: [
              ...old.members,
              {
                email: params.targetUser.email,
                id: params.targetUser.id,
                username: params.targetUser.username,
                avatarURL: params.targetUser.avatarURL || "",
                fullName: params.targetUser.fullName || "",
              },
            ],
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
