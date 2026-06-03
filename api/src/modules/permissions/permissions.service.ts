import { Injectable } from '@nestjs/common';
import { ProjectRole, WorkspaceRole } from 'generated/prisma/enums';
import PrismaService from 'src/shared/services/prisma.service';

const WORKSPACE_CREATE_PROJECT_ROLES: readonly WorkspaceRole[] = [
  WorkspaceRole.Owner,
  WorkspaceRole.Admin,
];

const WORKSPACE_UPDATE_ROLES: readonly WorkspaceRole[] = [
  WorkspaceRole.Owner,
  WorkspaceRole.Admin,
];

const WORKSPACE_DELETE_ROLES: readonly WorkspaceRole[] = [WorkspaceRole.Owner];

const PROJECT_UPDATE_ROLES: readonly ProjectRole[] = [
  ProjectRole.Owner,
  ProjectRole.Product_Owner,
  ProjectRole.Project_Manager,
];

const PROJECT_DELETE_ROLES: readonly ProjectRole[] = [
  ProjectRole.Owner,
  ProjectRole.Project_Manager,
  ProjectRole.Product_Owner,
];

const PROJECT_MEMBER_MANAGE_ROLES: readonly ProjectRole[] = [
  ProjectRole.Owner,
  ProjectRole.Project_Manager,
  ProjectRole.Product_Owner,
];

const TASK_CREATE_ROLES: readonly ProjectRole[] = [
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

const TASK_ASSIGN_ROLES: readonly ProjectRole[] = [
  ProjectRole.Owner,
  ProjectRole.Product_Owner,
  ProjectRole.Project_Manager,
  ProjectRole.Tech_Lead,
];

const TASK_DELETE_ROLES: readonly ProjectRole[] = [
  ProjectRole.Owner,
  ProjectRole.Project_Manager,
  ProjectRole.Tech_Lead,
  ProjectRole.Product_Owner,
];

const TASK_UPDATE_ROLES: readonly ProjectRole[] = [
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

const TASK_STATUS_UPDATE_ROLES: readonly ProjectRole[] = [
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
