import { useMutation } from "@tanstack/react-query";
import { inviteByEmails } from "../api/inviteByEmails";

export default function useInviteByEmails() {
  return useMutation({
    mutationFn: async (params: { workspaceSlug: string; emails: string[] }) => {
      return await inviteByEmails(params.workspaceSlug, params.emails);
    },
  });
}
