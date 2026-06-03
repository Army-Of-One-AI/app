import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import PrismaService from 'src/shared/services/prisma.service';
import { WorkspaceRole } from 'generated/prisma/enums';
import UpsertWorkspaceDto from './dto/upsert-workspace.dto';
import { Prisma } from 'generated/prisma/client';
import { getUniqueFields } from 'src/shared/helpers/prisma.helper';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: UpsertWorkspaceDto) {
    try {
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
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const fields = getUniqueFields(err);

        throw new BadRequestException({
          message: 'Validation failed',
          errors: Object.fromEntries(
            fields.map((field) => [
              field,
              `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
            ]),
          ),
        });
      }

      throw err;
    }
  }

  async getWorkspaceDetailsBySlug(slug: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: {
        slug,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return {
      id: workspace.id,
      createdAt: workspace.created_at,
      updatedAt: workspace.updated_at,
      name: workspace.name,
      slug: workspace.slug,
      logoURL: workspace.logo_url,
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
        role: true,
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
      role: wm.role,
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

  async findWorkspaceProjects(workspaceSlug: string) {
    const projects = await this.prisma.project.findMany({
      where: {
        deleted_at: null,
        workspace: {
          slug: workspaceSlug,
        },
      },
    });

    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      status: String(p.status),
      targetDate: String(p.target_date),
      startDate: String(p.start_date),
      description: p.description,
    }));
  }
}
