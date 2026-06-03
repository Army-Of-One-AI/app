import { Injectable, NotFoundException } from '@nestjs/common';
import PrismaService from 'src/shared/services/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskPriority, TaskStatus } from 'generated/prisma/enums';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async createNewTask(
    userId: string,
    workspaceSlug: string,
    projectSlug: string,
    dto: CreateTaskDto,
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

    const latestTask = await this.prisma.task.findFirst({
      where: {
        project_id: project.id,
        status: dto.status ?? TaskStatus.Backlog,
        deleted_at: null,
      },
      orderBy: {
        position: 'desc',
      },
      select: {
        position: true,
      },
    });

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description ?? undefined,

        status: dto.status ?? TaskStatus.Backlog,
        priority: dto.priority ?? TaskPriority.Medium,

        estimate: dto.estimate ?? undefined,
        due_date: dto.dueDate ? new Date(dto.dueDate) : undefined,

        position: latestTask ? latestTask.position.plus(1) : 0,

        project_id: project.id,
        creator_id: userId,

        assignee_id: dto.assigneeId ?? undefined,
        parent_task_id: dto.parentTaskId ?? undefined,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        estimate: true,
        due_date: true,
        started_at: true,
        completed_at: true,
        position: true,
        created_at: true,
        updated_at: true,
      },
    });

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      estimate: task.estimate,
      dueDate: task.due_date,
      startedAt: task.started_at,
      completedAt: task.completed_at,
      position: Number(task.position),
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    };
  }

  async getTasksByProjectSlug(projectSlug: string, workspaceSlug: string) {
    const tasks = await this.prisma.task.findMany({
      where: {
        project: {
          slug: projectSlug,
          workspace: {
            slug: workspaceSlug,
          },
          deleted_at: null,
        },
      },
      select: {
        id: true,
        title: true,
        completed_at: true,
        created_at: true,
        description: true,
        due_date: true,
        estimate: true,
        priority: true,
        position: true,
        status: true,
        started_at: true,
        assignee: {
          select: {
            id: true,
            email: true,
            userInfo: {
              select: {
                avatar_url: true,
                full_name: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            email: true,
            userInfo: {
              select: {
                avatar_url: true,
                full_name: true,
              },
            },
          },
        },
      },
    });

    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      completedAt: t.completed_at,
      createdAt: t.created_at,
      dueDate: t.due_date,
      estimate: t.estimate,
      priority: t.priority,
      position: t.position,
      status: t.status,
      startedAt: t.started_at,

      assignee: t.assignee
        ? {
            id: t.assignee.id,
            email: t.assignee.email,
            fullName: t.assignee.userInfo?.full_name ?? null,
            avatarURL: t.assignee.userInfo?.avatar_url ?? null,
          }
        : null,

      creator: t.creator
        ? {
            id: t.creator.id,
            email: t.creator.email,
            fullName: t.creator.userInfo?.full_name ?? null,
            avatarURL: t.creator.userInfo?.avatar_url ?? null,
          }
        : null,
    }));
  }
}
