import { Injectable } from '@nestjs/common';
import PrismaService from 'src/shared/services/prisma.service';
import FindProjectsDto from './dto/find-projects.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findProjects(dto: FindProjectsDto, workspaceSlug?: string) {
    const { name, status, page, limit } = dto;

    const where = {
      ...(workspaceSlug && {
        workspace: {
          slug: workspaceSlug,
        },
      }),
      ...(name && {
        name: {
          contains: name,
          mode: 'insensitive' as const,
        },
      }),
      ...(status && {
        status,
      }),
      deleted_at: null,
    };

    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          updated_at: 'desc',
        },
        include: {
          _count: {
            select: {
              tasks: true,
              members: true,
            },
          },
        },
      }),
      this.prisma.project.count({
        where,
      }),
    ]);

    return {
      items: projects.map((project) => ({
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description,
        status: String(project.status),
        targetDate: String(project.target_date),
        taskCount: project._count.tasks,
        memberCount: project._count.members,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
