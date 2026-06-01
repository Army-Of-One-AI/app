import { WorkspaceRole } from "@/shared/types/enums";

export type GetCurrentUserInfoResponse = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarImageURL: string;
  phoneNo: string;
  title: string;
  createdAt: string;
  workspaces: {
    id: string;
    name: string;
    slug: string;
    role: WorkspaceRole;
  }[];
};
