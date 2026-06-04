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

export type TActivity = {
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
    avatar: string;
  };
};

export type TaskDetails = Task & {
  activities: TActivity[];
};
