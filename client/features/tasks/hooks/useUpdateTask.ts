import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/apiClient";

type UpdateTaskPayload = {
  workspaceSlug: string;
  projectSlug: string;
  taskId: string;
  title?: string;
  description?: unknown;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  estimate?: number | null;
  assigneeId?: string | null;
  epicId?: string | null;
};

export default function useUpdateTask() {
  return useMutation({
    mutationFn: async ({
      workspaceSlug,
      projectSlug,
      taskId,
      ...payload
    }: UpdateTaskPayload) => {
      const { data } = await apiClient.patch(
        `/workspaces/${workspaceSlug}/projects/${projectSlug}/tasks/${taskId}`,
        payload
      );

      return data;
    },
  });
}
