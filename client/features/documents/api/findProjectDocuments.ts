import { apiClient } from "@/shared/api/apiClient";
import {
  FindProjectDocumentsParams,
  FindProjectDocumentsResponse,
} from "../types";

export const findProjectDocuments = async (
  projectSlug: string,
  workspaceSlug: string,
  params: FindProjectDocumentsParams
) => {
  const response = await apiClient.get(
    `/workspaces/${workspaceSlug}/projects/${projectSlug}/documents`,
    {
      params,
    }
  );
  return response.data as FindProjectDocumentsResponse;
};
