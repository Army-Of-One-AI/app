import { apiClient } from "@/shared/api/apiClient";

export const logout = async () => {
  await apiClient.post("/auth/logout");
};
