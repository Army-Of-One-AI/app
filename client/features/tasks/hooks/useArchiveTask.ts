import { useMutation } from "@tanstack/react-query";
import { archiveTask } from "../api/archieveTask";

export default function useArchiveTask() {
  return useMutation({
    mutationFn: async (params: {
      taskId: string;
      projectSlug: string;
      workspaceSlug: string;
    }) => {
      const { taskId, projectSlug, workspaceSlug } = params;
      return await archiveTask(taskId, workspaceSlug, projectSlug);
    },
  });
}
