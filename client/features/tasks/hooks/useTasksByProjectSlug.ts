import { useQuery } from "@tanstack/react-query";
import { getTasksByProjectSlug } from "../api/getTasksByProjectSlug";

export default function useTasksByProjectSlug(
  projectSlug: string,
  workspaceSlug: string
) {
  return useQuery({
    queryKey: ["get-tasks-by-project-slug", projectSlug, workspaceSlug],
    enabled:
      !!projectSlug &&
      !!workspaceSlug &&
      typeof projectSlug === "string" &&
      typeof workspaceSlug === "string",
    queryFn: async () => {
      return await getTasksByProjectSlug(projectSlug, workspaceSlug);
    },
  });
}
