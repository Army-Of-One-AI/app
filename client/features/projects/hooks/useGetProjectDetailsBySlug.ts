import { useQuery } from "@tanstack/react-query";
import { getProjectDetailsBySlug } from "../api/getProjectDetailsBySlug";

export default function useGetProjectDetailsBySlug(
  projectSlug: string,
  workspaceSlug: string
) {
  return useQuery({
    queryKey: ["get-project-details-by-slug", projectSlug, workspaceSlug],
    enabled:
      !!projectSlug &&
      !!workspaceSlug &&
      typeof projectSlug === "string" &&
      typeof workspaceSlug === "string",
    queryFn: async () => {
      const data = await getProjectDetailsBySlug(projectSlug, workspaceSlug);
      return data;
    },
  });
}
