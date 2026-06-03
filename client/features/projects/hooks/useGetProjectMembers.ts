import { useQuery } from "@tanstack/react-query";
import { getProjectMembers } from "../api/getProjectMembers";

export default function useGetProjectMembers(
  projectSlug: string,
  workspaceSlug: string
) {
  return useQuery({
    queryKey: ["get-project-members", projectSlug, workspaceSlug],
    enabled:
      !!projectSlug &&
      !!workspaceSlug &&
      typeof projectSlug === "string" &&
      typeof workspaceSlug === "string",
    queryFn: async () => {
      const data = await getProjectMembers(projectSlug, workspaceSlug);
      return data;
    },
  });
}
