import type { AgentRole } from "@/features/agent-roles/types";
import type { BoardColumn } from "@/features/boards/types";
import type { Project } from "@/features/projects/types";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskStatus = "BACKLOG" | "READY" | "IN_PROGRESS" | "REVIEW" | "TESTING" | "DONE";

export type Task = {
  id: string;
  project_id: string;
  column_id: string | null;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  order: number;
  assignee_role_id: string | null;
  created_by_agent_id: string | null;
  acceptance_criteria: string | null;
  technical_notes: string | null;
  test_cases: string | null;
  created_at: string;
  updated_at: string;
  project?: Project;
  column?: BoardColumn | null;
  assignee_role?: AgentRole | null;
  created_by_agent?: AgentRole | null;
};

export type TaskComment = {
  id: string;
  task_id: string;
  agent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  agent?: AgentRole | null;
};

export type CreateTaskInput = {
  projectId: string;
  columnId?: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  order?: number;
  assigneeRoleId?: string;
  acceptanceCriteria?: string;
  technicalNotes?: string;
  testCases?: string;
};

export type UpdateTaskInput = Partial<Omit<CreateTaskInput, "projectId">>;

export type MoveTaskInput = {
  columnId: string;
  order: number;
  status?: TaskStatus;
};

export type CreateTaskCommentInput = {
  agentId?: string;
  content: string;
};
