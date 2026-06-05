import { TaskActivity, TaskPriority, TaskStatus } from "@/shared/types/enums";

export type TaskUser = {
  id: string;
  email: string;
  username: string;
  fullName: string | null;
  avatarURL: string | null;
};

export type TaskDescription = {
  html: string;
  plainText: string;
};

export type Task = {
  id: string;
  title: string;
  description: TaskDescription | null;

  completedAt: string | null;
  createdAt: string;

  dueDate: string | null;
  startedAt: string | null;

  estimate: number | null;
  position: number;

  priority: TaskPriority;
  status: TaskStatus;

  assignee: TaskUser | null;
  creator: TaskUser | null;

  subtasks: Task[];

  parentTask: Task | null;
};

export type TaskActivityItem = {
  id: string;
  createdAt: string;
  activity: TaskActivity;
  metadata: {
    after: string;
    before: string;
  };
  actor: {
    fullName: string;
    id: string;
    avatarURL: string;
  };
};

export type TaskDetails = Task;

export type GetTaskActivitiesParams = {
  workspaceSlug: string;
  projectSlug: string;
  taskId: string;
  cursor?: string;
  limit?: number;
};

export type TaskActivitiesResponse = {
  items: TaskActivityItem[];
  pagination: {
    limit: number;
    hasMore: boolean;
    nextCursor: string | null;
  };
};
