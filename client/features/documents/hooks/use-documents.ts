"use client";

import { useQuery } from "@tanstack/react-query";
import { getDocuments } from "../api/get-documents";

export function useDocuments(projectId: string | undefined) {
  return useQuery({
    queryKey: ["documents", projectId],
    queryFn: () => getDocuments(projectId as string),
    enabled: Boolean(projectId),
  });
}
