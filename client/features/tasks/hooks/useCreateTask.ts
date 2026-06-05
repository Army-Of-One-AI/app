import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask } from "../api/createTask";
import { CreateTaskFormValues } from "@/app/[workspaceSlug]/(dashboard-layout)/projects/[projectSlug]/board/components/CreateTaskModal";

export default function useCreateTask(
  workspaceSlug: string,
  projectSlug: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskFormValues) =>
      createTask(workspaceSlug, projectSlug, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tasks", workspaceSlug, projectSlug],
      });
    },
  });
}
