import { useMutation } from "@tanstack/react-query";
import { createWorkspace } from "../api/createWorkspace";
import { CreateWorkspacePayload } from "../types";

export default function useCreateWorkspace() {
  return useMutation({
    mutationFn: async (payload: CreateWorkspacePayload) => {
      const data = await createWorkspace(payload);
      return data;
    },
  });
}
