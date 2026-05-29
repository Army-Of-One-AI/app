import type { Board } from "@/features/boards/types";
import type { Task } from "@/features/tasks/types";
import type { Workspace } from "@/features/workspaces/types";

export type Project = {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  workspace?: Workspace;
  boards?: Board[];
  tasks?: Task[];
};

export type CreateProjectInput = {
  workspaceId: string;
  name: string;
  description?: string;
};
