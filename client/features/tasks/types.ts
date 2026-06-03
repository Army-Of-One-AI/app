import { TaskPriority, TaskStatus } from "@/shared/types/enums";

export type TaskUser = {
  id: string;
  email: string;
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
};
