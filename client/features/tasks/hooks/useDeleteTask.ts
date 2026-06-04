import { useMutation } from "@tanstack/react-query";
import { deleteTask } from "../api/deleteTask";

export default function useDeleteTask() {
  return useMutation({
    mutationFn: async (params: {
      taskId: string;
      projectSlug: string;
      workspaceSlug: string;
    }) => {
      const { taskId, projectSlug, workspaceSlug } = params;
      return await deleteTask(taskId, workspaceSlug, projectSlug);
    },
  });
}
