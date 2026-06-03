import { Injectable, NotFoundException } from '@nestjs/common';
import PrismaService from 'src/shared/services/prisma.service';
import FindProjectsDto from './dto/find-projects.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { Prisma } from 'generated/prisma/browser';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    creatorId: string,
    workspaceSlug: string,
    dto: CreateProjectDto,
  ) {
    const { name, slug, description, startDate, status, targetDate } = dto;

    const project = await this.prisma.project.create({
      data: {
        name,
        slug,
        description: description === undefined ? undefined : description,
        status,
        start_date: startDate ? new Date(startDate) : undefined,
        target_date: targetDate ? new Date(targetDate) : undefined,
        members: {
          create: {
            member_id: creatorId,
            role: 'Product_Owner',
          },
        },
        workspace: {
          connect: {
            slug: workspaceSlug,
          },
        },
      },
    });

    return {
      id: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description,
      status: project.status,
      startDate: project.start_date,
      targetDate: project.target_date,
      completedAt: project.completed_at,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    };
  }

  async findProjects(dto: FindProjectsDto, workspaceSlug?: string) {
    const { name, status, page = 1, limit = 10 } = dto;

    const where: Prisma.ProjectWhereInput = {
      deleted_at: null,

      ...(workspaceSlug && {
        workspace: {
          slug: workspaceSlug,
        },
      }),

      ...(name?.trim() && {
        name: {
          contains: name.trim(),
          mode: 'insensitive',
        },
      }),

      ...(status && {
        status,
      }),
    };

    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          updated_at: 'desc',
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          status: true,
          target_date: true,
          start_date: true,
          created_at: true,
          updated_at: true,
          completed_at: true,

          _count: {
            select: {
              tasks: true,
            },
          },

          members: {
            select: {
              member: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  userInfo: {
                    select: {
                      full_name: true,
                      avatar_url: true,
                    },
                  },
                },
              },
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
        status: project.status,
        targetDate: project.target_date,
        taskCount: project._count.tasks,
        members: project.members.map(({ member }) => ({
          id: member.id,
          username: member.username,
          fullName: member.userInfo?.full_name ?? null,
          email: member.email,
          avatarURL: member.userInfo?.avatar_url ?? null,
        })),
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        completedAt: project.completed_at,
        startDate: project.start_date,
      })),

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProjectBySlug(projectSlug: string, workspaceSlug: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        slug: projectSlug,
        deleted_at: null,
        workspace: {
          slug: workspaceSlug,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        target_date: true,
        start_date: true,
        created_at: true,
        updated_at: true,
        completed_at: true,
        members: {
          select: {
            member: {
              select: {
                id: true,
                username: true,
                email: true,
                userInfo: {
                  select: {
                    full_name: true,
                    avatar_url: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Resource not found');
    }

    return {
      id: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description,
      status: project.status,
      targetDate: project.target_date,
      startDate: project.start_date,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      completedAt: project.completed_at,
      members: project.members.map((m) => ({
        id: m.member.id,
        username: m.member.username,
        email: m.member.email,
        fullName: m.member.userInfo?.full_name,
        avatarURL: m.member.userInfo?.avatar_url,
      })),
    };
  }

  async getProjectMembers(projectSlug: string, workspaceSlug: string) {
    const members = await this.prisma.projectMember.findMany({
      where: {
        project: {
          slug: projectSlug,
          workspace: {
            slug: workspaceSlug,
          },
        },
      },
      select: {
        role: true,
        member: {
          select: {
            id: true,
            username: true,
            email: true,
            userInfo: {
              select: {
                full_name: true,
                avatar_url: true,
              },
            },
          },
        },
      },
    });

    return members.map((m) => ({
      id: m.member.id,
      username: m.member.username,
      email: m.member.email,
      fullName: m.member.userInfo?.full_name,
      avatarURL: m.member.userInfo?.avatar_url,
      role: m.role,
    }));
  }
}
