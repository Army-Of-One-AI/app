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

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  private _getProjectPermissions(params: {
    workspaceRole?: WorkspaceRole | null;
    projectRole?: ProjectRole | null;
  }) {
    const { projectRole } = params;

    return {
      project: {
        canViewProject: !!projectRole,

        canUpdateProject:
          !!projectRole && PROJECT_UPDATE_ROLES.includes(projectRole),

        canDeleteProject:
          !!projectRole && PROJECT_DELETE_ROLES.includes(projectRole),

        canManageProjectMembers:
          !!projectRole && PROJECT_MEMBER_MANAGE_ROLES.includes(projectRole),
      },

      task: {
        canCreateTask: !!projectRole && TASK_CREATE_ROLES.includes(projectRole),

        canUpdateTask: !!projectRole && TASK_UPDATE_ROLES.includes(projectRole),

        canDeleteTask: !!projectRole && TASK_DELETE_ROLES.includes(projectRole),

        canAssignTask: !!projectRole && TASK_ASSIGN_ROLES.includes(projectRole),

        canArchiveTask:
          !!projectRole && TASK_ARCHIVE_ROLES.includes(projectRole),

        canUpdateTaskStatus:
          !!projectRole && TASK_STATUS_UPDATE_ROLES.includes(projectRole),
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
      permissions: this._getProjectPermissions({
        projectRole: projectMember?.role ?? null,
      }),
    };
  }
}
