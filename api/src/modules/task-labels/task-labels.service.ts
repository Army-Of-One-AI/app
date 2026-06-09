import { Injectable, NotFoundException } from '@nestjs/common';
import PrismaService from 'src/shared/services/prisma.service';
import CreateTaskLabelDto from './dto/create-task-label.dto';

@Injectable()
export class TaskLabelsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    workspaceSlug: string,
    projectSlug: string,
    dto: CreateTaskLabelDto,
  ) {
    const { name, color } = dto;

    const project = await this.prisma.project.findFirst({
      where: {
        slug: projectSlug,
        workspace: {
          slug: workspaceSlug,
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const newLabel = await this.prisma.taskLabel.create({
      data: {
        project_id: project.id,
        name,
        ...(color && { color }),
      },
    });

    return newLabel;
  }

  async delete(workspaceSlug: string, projectSlug: string, labelId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        slug: projectSlug,
        workspace: {
          slug: workspaceSlug,
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const label = await this.prisma.taskLabel.findFirst({
      where: {
        id: labelId,
        project_id: project.id,
      },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    return this.prisma.taskLabel.delete({
      where: {
        id: label.id,
      },
    });
  }

  async getProjectLabels(workspaceSlug: string, projectSlug: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        slug: projectSlug,
        workspace: {
          slug: workspaceSlug,
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return await this.prisma.taskLabel.findMany({
      where: {
        project_id: project.id,
      },
    });
  }
}
