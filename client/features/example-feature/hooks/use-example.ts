import { useQuery } from "@tanstack/react-query";
import { getExample } from "../api/get-example";

export default function useExample() {
  return useQuery({
    queryKey: ["get-example"],
    queryFn: async () => {
      return await getExample();
    },
  });
}
