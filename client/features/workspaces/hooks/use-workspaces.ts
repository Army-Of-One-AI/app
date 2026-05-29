"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createWorkspace, deleteWorkspace, getWorkspace, getWorkspaces, updateWorkspace } from "../api/workspaces-api";
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "../types";

export const workspacesQueryKey = ["workspaces"] as const;

export function useWorkspaces() {
  return useQuery({
    queryKey: workspacesQueryKey,
    queryFn: getWorkspaces,
  });
}

export function useWorkspace(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: () => getWorkspace(workspaceId as string),
    enabled: Boolean(workspaceId),
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWorkspaceInput) => createWorkspace(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspacesQueryKey });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWorkspaceInput }) => updateWorkspace(id, input),
    onSuccess: (workspace) => {
      void queryClient.invalidateQueries({ queryKey: workspacesQueryKey });
      void queryClient.invalidateQueries({ queryKey: ["workspace", workspace.id] });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWorkspace(id),
    onSuccess: (workspace) => {
      void queryClient.invalidateQueries({ queryKey: workspacesQueryKey });
      void queryClient.removeQueries({ queryKey: ["workspace", workspace.id] });
    },
  });
}
