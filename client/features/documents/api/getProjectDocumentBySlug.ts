import { apiClient } from "@/shared/api/apiClient";
import { DocumentDetails } from "../types";

export const getProjectDocumentBySlug = async (
  projectSlug: string,
  workspaceSlug: string,
  documentSlug: string
) => {
  const response = await apiClient.get(
    `/workspaces/${workspaceSlug}/projects/${projectSlug}/documents/${documentSlug}`
  );

  return response.data as DocumentDetails;
};
