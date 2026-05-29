"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAgentRun, getAgentRuns } from "../api/agent-runs-api";
import type { CreateAgentRunInput } from "../types";

export function useTaskAgentRuns(taskId: string | undefined) {
  return useQuery({
    queryKey: ["agent-runs", "task", taskId],
    queryFn: () => getAgentRuns({ taskId: taskId as string }),
    enabled: Boolean(taskId),
  });
}

export function useAgentRunsByAgent(agentId: string | undefined) {
  return useQuery({
    queryKey: ["agent-runs", "agent", agentId],
    queryFn: () => getAgentRuns({ agentId: agentId as string }),
    enabled: Boolean(agentId),
  });
}

export function useCreateAgentRun(taskId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAgentRunInput) => createAgentRun(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["agent-runs", "task", taskId] });
    },
  });
}
