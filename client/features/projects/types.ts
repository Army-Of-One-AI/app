import {
  ProjectRole,
  ProjectStatus,
  TaskActivity,
  TaskPriority,
  TaskStatus,
} from "@/shared/types/enums";
import { CurrentProjectUser } from "@/shared/types/types";

export type CreateProjectPayload = {
  name: string;
  slug: string;
  description?: ProjectDescription;
  status: ProjectStatus;
  startDate?: string;
  targetDate?: string;
  completedAt?: string;
};

export type ProjectDescription = {
  html: string;
  plainText: string;
};

export type Project = {
  id: string;
  name: string;
  slug: string;
  description: ProjectDescription | null;
  status: ProjectStatus;
  startDate: string | null;
  targetDate: string | null;
  completedAt: string | null;
  taskCount: number;
  members: {
    id: string;
    username: string;
    email: string;
    avatarURL?: string;
    fullName?: string;
  }[];
  createdAt: string;
  updatedAt: string | null;
  currentUser: CurrentProjectUser;
};

export type FindProjectsResponse = {
  items: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ProjectMember = {
  id: string;
  username: string;
  email: string;
  avatarURL?: string;
  fullName?: string;
  role: ProjectRole;
};

export type GetProjectSummaryResponse = {
  tasksCreatedLast7DaysCount: number;
  tasksUpdatedLast7DaysCount: number;
  tasksCompletedLast7DaysCount: number;
  tasksDueNext7DaysCount: number;
  tasksByAssignee: {
    id: string;
    fullName: string;
    username: string;
    avatarURL: string;
    tasksCount: number;
  }[];

  statusCounts: Record<TaskStatus, number>;
  priorityCounts: Partial<Record<TaskPriority, number>>;

  recentActivities: RecentTaskActivity[];

  currentUser: CurrentProjectUser;
};

export type RecentTaskActivity = {
  id: string;
  activity: TaskActivity;
  createdAt: string;
  metadata: {
    before: string | null;
    after: string | null;
  };
  task: {
    id: string;
    title: string;
    status: TaskStatus;
  };
  actor: {
    id: string;
    fullName: string;
    avatarURL: string | null;
  };
};

export type CreateEpicPayload = {
  title: string;
  description?: {
    html: string;
    plainText: string;
  };
  color?: string;
  startDate?: string;
  dueDate?: string;
};
