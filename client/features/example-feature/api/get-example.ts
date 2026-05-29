import apiClient from "@/shared/api/api-client"

export const getExample = async () => {
    const response = await apiClient.get("/example")
    return response.data;
}