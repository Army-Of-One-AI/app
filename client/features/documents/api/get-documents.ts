import apiClient from "@/shared/api/api-client";
import type { Document } from "../types";

export async function getDocuments(projectId: string) {
  const response = await apiClient.get<Document[]>("/documents", {
    params: { projectId },
  });

  if (process.env.NODE_ENV === "development") {
    console.debug("Documents query response", {
      projectId,
      count: response.data.length,
      documents: response.data,
    });
  }

  return response.data;
}
