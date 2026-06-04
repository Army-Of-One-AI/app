import { apiClient } from "@/shared/api/apiClient";

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

  await apiClient.post(
    `/workspaces/${workspaceSlug}/projects/${projectSlug}/documents`,
    payload
  );
};
