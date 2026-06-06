import { WorkspaceRole } from "@/shared/types/enums";
import { TaskUser } from "../tasks/types";

export type CreateWorkspacePayload = {
  name: string;
  slug: string;
  logoURL?: string;
};

export type WorkspaceDetails = {
  id: string;
  name: string;
  slug: string;
  logoURL?: string;
  createdAt: string;
  updatedAt?: string;
};

export type UpdateWorkspaceSettingsPayload = {
  name?: string;
  slug?: string;
  logoURL?: string;
};

export type WorkspaceMember = TaskUser & {
  role: WorkspaceRole;
  title: string | null;
  phoneNo: string | null;
  teamsCount: number;
  joinedAt: string;
};

export type WorkspaceInvite = {
  id: string;
  email: string;
  createdAt: string;
  acceptedAt: string | null;
  expiresAt: string;
  revokedAt: string | null;
  creator: {
    id: string;
    email: string;
    fullName?: string | null;
    avatarURL?: string | null;
  };
};
