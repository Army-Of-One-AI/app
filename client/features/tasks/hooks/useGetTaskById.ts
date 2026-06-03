import { useQuery } from "@tanstack/react-query";
import { getTaskById } from "../api/getTaskById";

export default function useGetTaskById(
  taskId: string,
  projectSlug: string,
  workspaceSlug: string,
) {
  return useQuery({
    queryKey: ["get-task-by-id", taskId, projectSlug, workspaceSlug],
    enabled:
      !!taskId &&
      !!projectSlug &&
      !!workspaceSlug &&
      typeof taskId === "string" &&
      typeof projectSlug === "string" &&
      typeof workspaceSlug === "string",
    queryFn: async () => {
      return await getTaskById(taskId, projectSlug, workspaceSlug);
    },
  });
}
