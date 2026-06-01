import { apiClient } from "@/shared/api/apiClient";
import { CreateWorkspacePayload } from "../types";

export const createWorkspace = async (payload: CreateWorkspacePayload) => {
  const response = await apiClient.post("/workspaces", payload);
  return response.data;
};
