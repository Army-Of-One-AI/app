import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ProjectRole,
  WorkspaceRole,
} from '../../../../generated/prisma/client.cjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertWorkspaceMember(userId: string, workspaceId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspace_id_member_id: { workspace_id: workspaceId, member_id: userId } },
    });

    if (!member) {
      throw new ForbiddenException('Workspace membership is required');
    }

    return member;
  }

  async assertWorkspaceRole(
    userId: string,
    workspaceId: string,
    allowedRoles: WorkspaceRole[],
  ) {
    const member = await this.assertWorkspaceMember(userId, workspaceId);

    if (!allowedRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient workspace permissions');
    }

    return member;
  }

  async assertProjectMember(userId: string, projectId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { project_id_member_id: { project_id: projectId, member_id: userId } },
    });

    if (!member) {
      throw new ForbiddenException('Project membership is required');
    }

    return member;
  }

  async assertProjectRole(
    userId: string,
    projectId: string,
    allowedRoles: ProjectRole[],
  ) {
    const member = await this.assertProjectMember(userId, projectId);

    if (!allowedRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient project permissions');
    }

    return member;
  }

  async getActiveProject(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deleted_at: null },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }
}
