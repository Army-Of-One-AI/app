import { useQuery } from "@tanstack/react-query";
import { getWorkspaceDetailsBySlug } from "../api/getWorkpaceDetailsBySlug";

export default function useWorkspaceDetailsBySlug(slug: string) {
  return useQuery({
    queryKey: ["workspace-details", slug],
    enabled: !!slug,
    queryFn: async () => {
      const data = await getWorkspaceDetailsBySlug(slug);
      return data;
    },
  });
}
