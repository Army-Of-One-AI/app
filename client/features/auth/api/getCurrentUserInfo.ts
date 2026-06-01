import { apiClient } from "@/shared/api/apiClient";
import { GetCurrentUserInfoResponse } from "../types";

export const getCurrentUserInfo = async () => {
  const response = await apiClient.get("/auth/me");
  return response.data as GetCurrentUserInfoResponse;
};
