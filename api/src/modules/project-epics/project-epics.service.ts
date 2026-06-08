import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEpicDto } from './dto/create-epic.dto';
import PrismaService from 'src/shared/services/prisma.service';

@Injectable()
export class ProjectEpicsService {
  constructor(private readonly prisma: PrismaService) {}

  async createEpic(
    workspaceSlug: string,
    projectSlug: string,
    dto: CreateEpicDto,
  ) {
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
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const lastEpic = await this.prisma.epic.findFirst({
      where: {
        project_id: project.id,
        deleted_at: null,
      },
      orderBy: {
        position: 'desc',
      },
      select: {
        position: true,
      },
    });

    const epic = await this.prisma.epic.create({
      data: {
        project_id: project.id,
        title: dto.title.trim(),
        description: dto.description ?? {},
        color: dto.color ?? null,
        start_date: dto.startDate ? new Date(dto.startDate) : null,
        due_date: dto.dueDate ? new Date(dto.dueDate) : null,
        position: (lastEpic?.position ?? 0) + 1,
      },
    });

    return {
      id: epic.id,
      title: epic.title,
      description: epic.description,
      color: epic.color,
      position: epic.position,
      startDate: epic.start_date,
      dueDate: epic.due_date,
      createdAt: epic.created_at,
      updatedAt: epic.updated_at,
    };
  }

  async getProjectEpics(projectSlug: string) {
    const epics = await this.prisma.epic.findMany({
      where: {
        project: {
          slug: projectSlug,
        },
      },
    });

    return epics.map((epic) => ({
      id: epic.id,
      title: epic.title,
      description: epic.description,
      color: epic.color,
      position: epic.position,
      startDate: epic.start_date,
      dueDate: epic.due_date,
      createdAt: epic.created_at,
      updatedAt: epic.updated_at,
    }));
  }
}
