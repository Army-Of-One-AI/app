import { ProjectRole, WorkspaceRole } from "./enums";

export type CurrentProjectUser = {
  projectRole: ProjectRole | null;
  permissions: {
    project: {
      canViewProject: boolean;
      canUpdateProject: boolean;
      canDeleteProject: boolean;
      canManageProjectMembers: boolean;
    };
    task: {
      canCreateTask: boolean;
      canUpdateTask: boolean;
      canDeleteTask: boolean;
      canAssignTask: boolean;
      canArchiveTask: boolean;
      canUpdateTaskStatus: boolean;
    };
  };
};

export type ProjectPermissions = CurrentProjectUser["permissions"];

export type WorkspacePermissions = {
  workspace: {
    canUpdate: boolean;
    canDelete: boolean;
  };
  project: {
    canCreate: boolean;
  };
  member: {
    canView: boolean;
    canManage: boolean;
  };
};

export type ProjectPermissionEntry = {
  id: string;
  slug: string;
  role: ProjectRole;
  permissions: ProjectPermissions;
};

export type CurrentWorkspaceUserPermissions = {
  workspaceRole: WorkspaceRole | null;
  workspacePermissions: WorkspacePermissions;
  projectPermissions: {
    byId: Record<string, ProjectPermissionEntry>;
    bySlug: Record<string, ProjectPermissionEntry>;
  };
};
