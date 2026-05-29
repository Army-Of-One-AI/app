import type { AgentRole } from "@/features/agent-roles/types";
import type { Task } from "@/features/tasks/types";

export type AgentRunStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "CANCELLED";

export type AgentRun = {
  id: string;
  task_id: string | null;
  agent_id: string;
  status: AgentRunStatus;
  input: string;
  output: string | null;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  agent?: AgentRole;
  task?: Task | null;
};

export type CreateAgentRunInput = {
  agentId: string;
  taskId?: string;
  input: string;
};
