import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  withCredentials: true,
});

apiClient.interceptors.request.use((opt) => {
  // const accessToken = getAccessToken();

  // if (accessToken && accessToken.trim().length > 0) {
  //   opt.headers.Authorization = `Bearer ${accessToken}`;
  // } else {
  //   if ("has" in opt.headers && opt.headers.has("Authorization")) {
  //     opt.headers.delete("Authorization");
  //   } else {
  //     delete opt.headers.Authorization;
  //   }
  // }

  return opt;
});
