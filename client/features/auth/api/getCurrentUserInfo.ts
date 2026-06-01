import { apiClient } from "@/shared/api/apiClient"

export const getCurrentUserInfo = async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
}