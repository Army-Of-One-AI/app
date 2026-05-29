"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAgentRole, getAgentRoles } from "../api/agent-roles-api";
import type { CreateAgentRoleInput } from "../types";

export function useAgentRoles(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["agent-roles", workspaceId],
    queryFn: () => getAgentRoles(workspaceId as string),
    enabled: Boolean(workspaceId),
  });
}

export function useCreateAgentRole(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAgentRoleInput) => createAgentRole(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["agent-roles", workspaceId] });
    },
  });
}
