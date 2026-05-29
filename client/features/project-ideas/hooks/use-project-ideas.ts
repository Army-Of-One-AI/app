"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import {
  cancelGeneratePlanJob,
  createProjectFromIdea,
  expandProjectIdea,
  generateExecutionPlan,
  getGeneratePlanJob,
  startGeneratePlanJob,
} from "../api/project-ideas-api";
import type { CreateProjectFromIdeaInput, GenerationMode, ProductFeature, ProjectIdeaInput, StartGeneratePlanJobInput } from "../types";

export function useExpandProjectIdea() {
  return useMutation({
    mutationFn: (input: ProjectIdeaInput) => expandProjectIdea(input),
  });
}

export function useGenerateExecutionPlan() {
  return useMutation({
    mutationFn: (input: { features: ProductFeature[]; generationMode: GenerationMode }) => generateExecutionPlan(input),
  });
}

export function useStartGeneratePlanJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StartGeneratePlanJobInput) => startGeneratePlanJob(input),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["project-idea-plan-job", result.jobId] });
    },
  });
}

export function useGeneratePlanJob(jobId: string | undefined) {
  return useQuery({
    queryKey: ["project-idea-plan-job", jobId],
    queryFn: () => getGeneratePlanJob(jobId as string),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "PENDING" || status === "RUNNING" ? 2500 : false;
    },
  });
}

export function useCancelGeneratePlanJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => cancelGeneratePlanJob(jobId),
    onSuccess: (job) => {
      queryClient.setQueryData(["project-idea-plan-job", job.id], job);
    },
  });
}

export function useCreateProjectFromIdea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectFromIdeaInput) => createProjectFromIdea(input),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["projects", result.project.workspace_id] });
      void queryClient.invalidateQueries({ queryKey: ["workspace", result.project.workspace_id] });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["project", result.project.id] });
    },
  });
}
