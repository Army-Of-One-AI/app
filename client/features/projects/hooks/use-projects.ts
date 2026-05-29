"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProject, getAllProjects, getProject, getProjects } from "../api/projects-api";
import type { CreateProjectInput } from "../types";

export function useProjects(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: () => getProjects(workspaceId as string),
    enabled: Boolean(workspaceId),
  });
}

export function useAllProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: getAllProjects,
  });
}

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId as string),
    enabled: Boolean(projectId),
  });
}

export function useCreateProject(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) => createProject(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
    },
  });
}
