import { useMutation } from "@tanstack/react-query";
import { UpdateWorkspaceSettingsPayload } from "../types";
import { updateWorkspaceSettings } from "../api/updateWorkspaceSettings";

export default function useUpdateWorkspaceSettings() {
  return useMutation({
    mutationFn: async (params: {
      workspaceSlug: string;
      payload: UpdateWorkspaceSettingsPayload;
    }) => {
      return await updateWorkspaceSettings(
        params.workspaceSlug,
        params.payload
      );
    },
  });
}
