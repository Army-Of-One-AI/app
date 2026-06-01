import { useQuery } from "@tanstack/react-query";
import { getCurrentUserInfo } from "../api/getCurrentUserInfo";

export default function useCurrentUserInfo() {
  return useQuery({
    queryKey: ["current-user-info"],
    queryFn: async () => {
      return await getCurrentUserInfo();
    },
  });
}
