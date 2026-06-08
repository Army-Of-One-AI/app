import { useQuery } from "@tanstack/react-query";
import { getProjectDocumentBySlug } from "../api/getProjectDocumentBySlug";

export default function useProjectDocument(
  projectSlug: string,
  workspaceSlug: string,
  documentSlug: string
) {
  return useQuery({
    queryKey: [
      "get-project-document",
      workspaceSlug,
      projectSlug,
      documentSlug,
    ],
    enabled: !!projectSlug && !!workspaceSlug && !!documentSlug,
    queryFn: async () => {
      return await getProjectDocumentBySlug(
        projectSlug,
        workspaceSlug,
        documentSlug
      );
    },
  });
}
