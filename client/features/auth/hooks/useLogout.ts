import { useMutation } from "@tanstack/react-query";
import { logout } from "../api/logout";

export default function useLogout() {
  return useMutation({
    mutationFn: async () => {
      await logout();
    },
  });
}
