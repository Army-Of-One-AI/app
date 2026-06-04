import { useQuery } from "@tanstack/react-query";
import { findProjectDocuments } from "../api/findProjectDocuments";
import { FindProjectDocumentsParams } from "../types";

export default function useProjectDocuments(
  projectSlug: string,
  workspaceSlug: string,
  params: FindProjectDocumentsParams
) {
  return useQuery({
    queryKey: ["find-project-documents", workspaceSlug, projectSlug, params],
    enabled:
      !!projectSlug &&
      !!workspaceSlug &&
      typeof projectSlug === "string" &&
      typeof workspaceSlug === "string",
    queryFn: async () => {
      return await findProjectDocuments(projectSlug, workspaceSlug, params);
    },
  });
}
