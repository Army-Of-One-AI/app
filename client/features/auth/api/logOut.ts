import { apiClient } from "@/shared/api/apiClient";

export const logOut = async () => {
  await apiClient.post("/auth/logout");
};
