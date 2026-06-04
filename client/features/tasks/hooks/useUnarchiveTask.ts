import { useMutation } from "@tanstack/react-query";
import { unarchiveTask } from "../api/unarchieveTask";

export default function useUnarchiveTask() {
  return useMutation({
    mutationFn: async (params: {
      taskId: string;
      projectSlug: string;
      workspaceSlug: string;
    }) => {
      const { taskId, projectSlug, workspaceSlug } = params;
      return await unarchiveTask(taskId, workspaceSlug, projectSlug);
    },
  });
}
