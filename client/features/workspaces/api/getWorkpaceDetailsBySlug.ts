import { apiClient } from "@/shared/api/apiClient";
import { WorkspaceDetails } from "../types";
import axios from "axios";

export const getWorkspaceDetailsBySlug = async (slug: string) => {
  try {
    const response = await apiClient.get(`/workspaces/${slug}`);
    return response.data as WorkspaceDetails;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.status === 403) {
        window.location.href = "/forbbiden";
      }
      throw new Error("Cannot get workspace details")
    }
  }
};
