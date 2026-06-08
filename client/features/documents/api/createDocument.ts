import { apiClient } from "@/shared/api/apiClient";
import { DocumentDetails } from "../types";

export const createDocument = async (params: {
  workspaceSlug: string;
  projectSlug: string;
  title: string;
  content: {
    plainText: string;
    html: string;
  };
}) => {
  const { workspaceSlug, projectSlug, title, content } = params;

  const payload = {
    title,
    content,
  };

  const response = await apiClient.post(
    `/workspaces/${workspaceSlug}/projects/${projectSlug}/documents`,
    payload
  );

  return response.data as DocumentDetails;
};
