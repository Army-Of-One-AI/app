import apiClient from "@/shared/api/api-client";
import type { CreateDocumentInput, Document } from "../types";
export { getDocuments } from "./get-documents";

export async function createDocument(input: CreateDocumentInput) {
  const response = await apiClient.post<Document>("/documents", input);
  return response.data;
}
