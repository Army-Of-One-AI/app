import { Injectable } from '@nestjs/common';
import PrismaService from 'src/shared/services/prisma.service';
import { WorkspaceRole } from 'generated/prisma/enums';
import UpsertWorkspaceDto from './dto/upsert-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: UpsertWorkspaceDto) {
    const workspace = await this.prisma.workspace.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        ...(dto.logoURL && { logo_url: dto.logoURL }),
        members: {
          create: {
            member_id: userId,
            role: WorkspaceRole.Owner,
          },
        },
      },
    });

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      logoURL: workspace.logo_url,
      createdAt: workspace.created_at,
      updatedAt: workspace.updated_at,
    };
  }

  async updateWorkspaceSetting(workspaceSlug: string, dto: UpsertWorkspaceDto) {
    const { name, slug, logoURL } = dto;

    const workspace = await this.prisma.workspace.update({
      where: {
        slug: workspaceSlug,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(logoURL !== undefined && { logo_url: logoURL }),
        ...(slug !== undefined && { slug }),
      },
    });

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      logoURL: workspace.logo_url,
      createdAt: workspace.created_at,
      updatedAt: workspace.updated_at,
    };
  }

  async getWorkspacesByUserId(userId: string) {
    const workspaces = await this.prisma.workspaceMember.findMany({
      where: { member_id: userId },
      select: {
        workspace: true,
      },
      orderBy: {
        workspace: {
          created_at: 'desc',
        },
      },
    });

    return workspaces.map((wm) => ({
      id: wm.workspace.id,
      name: wm.workspace.name,
      slug: wm.workspace.slug,
    }));
  }

  async getUserWorkspaceMembership(userId: string, workspaceSlug: string) {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: {
        member_id: userId,
        workspace: {
          slug: workspaceSlug,
        },
      },
    });

    return membership;
  }
}
