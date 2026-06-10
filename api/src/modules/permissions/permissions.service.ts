import { Injectable } from '@nestjs/common';
import { ProjectRole, WorkspaceRole } from 'generated/prisma/enums';
import PrismaService from 'src/shared/services/prisma.service';

export const WORKSPACE_CREATE_PROJECT_ROLES: WorkspaceRole[] = [
  WorkspaceRole.Owner,
  WorkspaceRole.Admin,
];

export const WORKSPACE_UPDATE_ROLES: WorkspaceRole[] = [
  WorkspaceRole.Owner,
  WorkspaceRole.Admin,
];

export const WORKSPACE_USERS_MANAGEMENT_ROLES: WorkspaceRole[] = [
  WorkspaceRole.Owner,
  WorkspaceRole.Admin,
];

export const WORKSPACE_DELETE_ROLES: WorkspaceRole[] = [WorkspaceRole.Owner];

export const PROJECT_READ_ROLES: ProjectRole[] = [
  ProjectRole.Owner,
  ProjectRole.Product_Owner,
  ProjectRole.Project_Manager,
  ProjectRole.Tech_Lead,
  ProjectRole.Designer,
  ProjectRole.DevOps,
  ProjectRole.Developer,
  ProjectRole.QC,
  ProjectRole.Member,
];

export const PROJECT_CREATE_ROLES: ProjectRole[] = [
  ProjectRole.Owner,
  ProjectRole.Product_Owner,
  ProjectRole.Project_Manager,
  ProjectRole.Tech_Lead,
  ProjectRole.Designer,
  ProjectRole.DevOps,
  ProjectRole.Developer,
  ProjectRole.QC,
  ProjectRole.Member,
];

export const PROJECT_UPDATE_ROLES: ProjectRole[] = [
  ProjectRole.Owner,
  ProjectRole.Product_Owner,
  ProjectRole.Project_Manager,
];

export const PROJECT_DELETE_ROLES: ProjectRole[] = [
  ProjectRole.Owner,
  ProjectRole.Project_Manager,
  ProjectRole.Product_Owner,
];

export const PROJECT_MEMBER_MANAGE_ROLES: ProjectRole[] = [
  ProjectRole.Owner,
  ProjectRole.Project_Manager,
  ProjectRole.Product_Owner,
];

export const TASK_READ_ROLES: ProjectRole[] = [
  ProjectRole.Owner,
  ProjectRole.Product_Owner,
  ProjectRole.Project_Manager,
  ProjectRole.Tech_Lead,
  ProjectRole.Designer,
  ProjectRole.DevOps,
  ProjectRole.Developer,
  ProjectRole.QC,
  ProjectRole.Member,
];

export const TASK_CREATE_ROLES: ProjectRole[] = [
  ProjectRole.Owner,
  ProjectRole.Product_Owner,
  ProjectRole.Project_Manager,
  ProjectRole.Tech_Lead,
  ProjectRole.Designer,
  ProjectRole.DevOps,
  ProjectRole.Developer,
  ProjectRole.QC,
  ProjectRole.Member,
];

export const TASK_ASSIGN_ROLES: ProjectRole[] = [
  ProjectRole.Owner,
  ProjectRole.Product_Owner,
  ProjectRole.Project_Manager,
  ProjectRole.Tech_Lead,
];

export const TASK_DELETE_ROLES: ProjectRole[] = [
  ProjectRole.Owner,
  ProjectRole.Project_Manager,
  ProjectRole.Tech_Lead,
  ProjectRole.Product_Owner,
];

export const TASK_ARCHIVE_ROLES: ProjectRole[] = [
  ProjectRole.Owner,
  ProjectRole.Project_Manager,
  ProjectRole.Tech_Lead,
  ProjectRole.Product_Owner,
];

export const TASK_UPDATE_ROLES: ProjectRole[] = [
  ProjectRole.Owner,
  ProjectRole.Product_Owner,
  ProjectRole.Project_Manager,
  ProjectRole.Tech_Lead,
  ProjectRole.Designer,
  ProjectRole.DevOps,
  ProjectRole.Developer,
  ProjectRole.QC,
  ProjectRole.Member,
];

export const TASK_STATUS_UPDATE_ROLES: ProjectRole[] = [
  ProjectRole.Owner,
  ProjectRole.Product_Owner,
  ProjectRole.Project_Manager,
  ProjectRole.Tech_Lead,
  ProjectRole.Designer,
  ProjectRole.DevOps,
  ProjectRole.Developer,
  ProjectRole.QC,
  ProjectRole.Member,
];

type ProjectPermissions = {
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

type WorkspacePermissions = {
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

type ProjectPermissionEntry = {
  id: string;
  slug: string;
  role: ProjectRole;
  permissions: ProjectPermissions;
};

type ProjectPermissionsLookup = {
  byId: Record<string, ProjectPermissionEntry>;
  bySlug: Record<string, ProjectPermissionEntry>;
};

function hasRole<Role extends string>(
  role: Role | null | undefined,
  allowedRoles: readonly Role[],
) {
  return !!role && allowedRoles.includes(role);
}

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  private getProjectPermissions(params: {
    projectRole?: ProjectRole | null;
  }): ProjectPermissions {
    const { projectRole } = params;

    return {
      project: {
        canViewProject: hasRole(projectRole, PROJECT_READ_ROLES),
        canUpdateProject: hasRole(projectRole, PROJECT_UPDATE_ROLES),
        canDeleteProject: hasRole(projectRole, PROJECT_DELETE_ROLES),
        canManageProjectMembers: hasRole(
          projectRole,
          PROJECT_MEMBER_MANAGE_ROLES,
        ),
      },

      task: {
        canCreateTask: hasRole(projectRole, TASK_CREATE_ROLES),
        canUpdateTask: hasRole(projectRole, TASK_UPDATE_ROLES),
        canDeleteTask: hasRole(projectRole, TASK_DELETE_ROLES),
        canAssignTask: hasRole(projectRole, TASK_ASSIGN_ROLES),
        canArchiveTask: hasRole(projectRole, TASK_ARCHIVE_ROLES),
        canUpdateTaskStatus: hasRole(projectRole, TASK_STATUS_UPDATE_ROLES),
      },
    };
  }

  private getWorkspacePermissions(params: {
    workspaceRole?: WorkspaceRole | null;
  }): WorkspacePermissions {
    const { workspaceRole } = params;

    return {
      workspace: {
        canUpdate: hasRole(workspaceRole, WORKSPACE_UPDATE_ROLES),
        canDelete: hasRole(workspaceRole, WORKSPACE_DELETE_ROLES),
      },
      project: {
        canCreate: hasRole(workspaceRole, WORKSPACE_CREATE_PROJECT_ROLES),
      },
      member: {
        canView: !!workspaceRole,
        canManage: hasRole(workspaceRole, WORKSPACE_USERS_MANAGEMENT_ROLES),
      },
    };
  }

  async getCurrentUserProjectPermissions(params: {
    userId: string;
    workspaceSlug: string;
    projectSlug: string;
  }) {
    const projectMember = await this.prisma.projectMember.findFirst({
      where: {
        member_id: params.userId,
        project: {
          slug: params.projectSlug,
          workspace: {
            slug: params.workspaceSlug,
          },
          deleted_at: null,
        },
      },
      select: {
        role: true,
      },
    });

    return {
      projectRole: projectMember?.role ?? null,
      permissions: this.getProjectPermissions({
        projectRole: projectMember?.role ?? null,
      }),
    };
  }

  async getCurrentUserWorkspacePermissions(params: {
    userId: string;
    workspaceSlug: string;
  }) {
    const workspaceMember = await this.prisma.workspaceMember.findFirst({
      where: {
        member_id: params.userId,
        workspace: {
          slug: params.workspaceSlug,
        },
      },
      select: {
        role: true,
        workspace_id: true,
      },
    });

    if (!workspaceMember) {
      return {
        workspaceRole: null,
        workspacePermissions: this.getWorkspacePermissions({
          workspaceRole: null,
        }),
        projectPermissions: {
          byId: {},
          bySlug: {},
        },
      };
    }

    const projectMembers = await this.prisma.projectMember.findMany({
      where: {
        member_id: params.userId,
        project: {
          workspace_id: workspaceMember.workspace_id,
          deleted_at: null,
        },
      },
      select: {
        role: true,
        project: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
    });

    const projectPermissions: ProjectPermissionsLookup = {
      byId: {},
      bySlug: {},
    };

    projectMembers.forEach((projectMember) => {
      const permissions = this.getProjectPermissions({
        projectRole: projectMember.role,
      });
      const entry: ProjectPermissionEntry = {
        id: projectMember.project.id,
        slug: projectMember.project.slug,
        role: projectMember.role,
        permissions,
      };

      projectPermissions.byId[entry.id] = entry;
      projectPermissions.bySlug[entry.slug] = entry;
    });

    const workspacePermissions: WorkspacePermissions =
      this.getWorkspacePermissions({
        workspaceRole: workspaceMember.role,
      });

    return {
      workspaceRole: workspaceMember.role,
      workspacePermissions,
      projectPermissions,
    };
  }
}
