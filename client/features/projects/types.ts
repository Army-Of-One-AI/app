import { ProjectStatus } from "@/shared/types/enums";

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
