import { WorkspaceRole } from "@/shared/types/enums";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateWorkspaceMemberRole } from "../api/updateWorkspaceMemberRole";
import { WorkspaceMember } from "../types";

export default function useUpdateWorkspaceMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      workspaceSlug: string;
      memberId: string;
      role: WorkspaceRole;
    }) => {
      return await updateWorkspaceMemberRole(
        params.workspaceSlug,
        params.memberId,
        params.role
      );
    },
    onMutate: async (params) => {
      const queryKey = ["get-workspace-members", params.workspaceSlug];

      await queryClient.cancelQueries({ queryKey });

      const previousMembers =
        queryClient.getQueryData<WorkspaceMember[]>(queryKey);

      queryClient.setQueryData<WorkspaceMember[]>(queryKey, (old) => {
        if (!old) return old;

        return old.map((member) =>
          member.id === params.memberId
            ? {
                ...member,
                role: params.role,
              }
            : member
        );
      });

      return { previousMembers };
    },
    onError: (_error, params, context) => {
      queryClient.setQueryData(
        ["get-workspace-members", params.workspaceSlug],
        context?.previousMembers
      );
    },
    onSettled: (_data, _error, params) => {
      queryClient.invalidateQueries({
        queryKey: ["get-workspace-members", params.workspaceSlug],
      });
    },
  });
}
