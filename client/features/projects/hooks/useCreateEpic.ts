import { useMutation } from "@tanstack/react-query";
import { CreateEpicPayload } from "../types";
import { apiClient } from "@/shared/api/apiClient";

export default function useCreateEpic() {
  return useMutation({
    mutationFn: async (params: {
      payload: CreateEpicPayload;
      workspaceSlug: string;
      projectSlug: string;
    }) => {
      const { payload, projectSlug, workspaceSlug } = params;

      const response = await apiClient.post(
        `/workspaces/${workspaceSlug}/projects/${projectSlug}/epics`,
        payload
      );

      return response.data;
    },
  });
}
