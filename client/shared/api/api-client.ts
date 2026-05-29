import axios from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_API_URL ?? "http://localhost:3001";

const apiClient = axios.create({
  baseURL: BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("access_token");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  } else {
    if (config.headers.has("Authorization")) {
      config.headers.delete("Authorization");
    }
  }
  return config;
});

export default apiClient;
