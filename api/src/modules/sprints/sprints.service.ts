import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { SprintStatus, TaskStatus } from 'generated/prisma/enums';
import PrismaService from 'src/shared/services/prisma.service';

type CreateSprintDto = {
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
};

type UpdateSprintDto = Partial<CreateSprintDto> & {
  status?: SprintStatus;
};

@Injectable()
export class SprintsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getProject(workspaceSlug: string, projectSlug: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        slug: projectSlug,
        deleted_at: null,
        workspace: {
          slug: workspaceSlug,
          deleted_at: null,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        workspace_id: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private validateSprintDates(startDate: Date, endDate: Date) {
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid sprint date');
    }

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }
  }

  async createSprint(
    workspaceSlug: string,
    projectSlug: string,
    dto: CreateSprintDto,
  ) {
    const project = await this.getProject(workspaceSlug, projectSlug);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    this.validateSprintDates(startDate, endDate);

    const sprint = await this.prisma.sprint.create({
      data: {
        name: dto.name.trim(),
        goal: dto.goal?.trim() || null,
        start_date: startDate,
        end_date: endDate,
        project_id: project.id,
      },
    });

    return this.mapSprint(sprint);
  }

  async getProjectSprints(workspaceSlug: string, projectSlug: string) {
    const project = await this.getProject(workspaceSlug, projectSlug);

    const sprints = await this.prisma.sprint.findMany({
      where: {
        project_id: project.id,
        deleted_at: null,
      },
      include: {
        tasks: {
          where: {
            deleted_at: null,
          },
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: [{ start_date: 'desc' }, { created_at: 'desc' }],
    });

    return sprints.map((sprint) => this.mapSprintWithStats(sprint));
  }

  async getSprintById(
    workspaceSlug: string,
    projectSlug: string,
    sprintId: string,
  ) {
    const project = await this.getProject(workspaceSlug, projectSlug);

    const sprint = await this.prisma.sprint.findFirst({
      where: {
        id: sprintId,
        project_id: project.id,
        deleted_at: null,
      },
      include: {
        tasks: {
          where: {
            deleted_at: null,
          },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            due_date: true,
            assignee: {
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
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    return {
      ...this.mapSprintWithStats(sprint),
      tasks: sprint.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.due_date,
        assignee: task.assignee
          ? {
              id: task.assignee.id,
              username: task.assignee.username,
              email: task.assignee.email,
              fullName: task.assignee.userInfo?.full_name,
              avatarURL: task.assignee.userInfo?.avatar_url,
            }
          : null,
      })),
    };
  }

  async updateSprint(
    workspaceSlug: string,
    projectSlug: string,
    sprintId: string,
    dto: UpdateSprintDto,
  ) {
    const project = await this.getProject(workspaceSlug, projectSlug);

    const sprint = await this.prisma.sprint.findFirst({
      where: {
        id: sprintId,
        project_id: project.id,
        deleted_at: null,
      },
    });

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    const nextStartDate =
      dto.startDate !== undefined ? new Date(dto.startDate) : sprint.start_date;

    const nextEndDate =
      dto.endDate !== undefined ? new Date(dto.endDate) : sprint.end_date;

    this.validateSprintDates(nextStartDate, nextEndDate);

    const updatedSprint = await this.prisma.sprint.update({
      where: {
        id: sprint.id,
      },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.goal !== undefined && { goal: dto.goal?.trim() || null }),
        ...(dto.startDate !== undefined && { start_date: nextStartDate }),
        ...(dto.endDate !== undefined && { end_date: nextEndDate }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });

    return this.mapSprint(updatedSprint);
  }

  async startSprint(
    workspaceSlug: string,
    projectSlug: string,
    sprintId: string,
  ) {
    const project = await this.getProject(workspaceSlug, projectSlug);

    return this.prisma.$transaction(async (tx) => {
      const sprint = await tx.sprint.findFirst({
        where: {
          id: sprintId,
          project_id: project.id,
          deleted_at: null,
        },
      });

      if (!sprint) {
        throw new NotFoundException('Sprint not found');
      }

      if (sprint.status === SprintStatus.Completed) {
        throw new BadRequestException('Completed sprint cannot be started');
      }

      const activeSprint = await tx.sprint.findFirst({
        where: {
          project_id: project.id,
          status: SprintStatus.Active,
          deleted_at: null,
          NOT: {
            id: sprint.id,
          },
        },
      });

      if (activeSprint) {
        throw new BadRequestException('Project already has an active sprint');
      }

      const updatedSprint = await tx.sprint.update({
        where: {
          id: sprint.id,
        },
        data: {
          status: SprintStatus.Active,
        },
      });

      return this.mapSprint(updatedSprint);
    });
  }

  async completeSprint(
    workspaceSlug: string,
    projectSlug: string,
    sprintId: string,
  ) {
    const project = await this.getProject(workspaceSlug, projectSlug);

    const sprint = await this.prisma.sprint.findFirst({
      where: {
        id: sprintId,
        project_id: project.id,
        deleted_at: null,
      },
    });

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    if (sprint.status === SprintStatus.Completed) {
      throw new BadRequestException('Sprint is already completed');
    }

    const updatedSprint = await this.prisma.sprint.update({
      where: {
        id: sprint.id,
      },
      data: {
        status: SprintStatus.Completed,
        completed_at: new Date(),
      },
    });

    return this.mapSprint(updatedSprint);
  }

  async cancelSprint(
    workspaceSlug: string,
    projectSlug: string,
    sprintId: string,
  ) {
    const project = await this.getProject(workspaceSlug, projectSlug);

    const sprint = await this.prisma.sprint.findFirst({
      where: {
        id: sprintId,
        project_id: project.id,
        deleted_at: null,
      },
    });

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    const updatedSprint = await this.prisma.sprint.update({
      where: {
        id: sprint.id,
      },
      data: {
        status: SprintStatus.Canceled,
      },
    });

    return this.mapSprint(updatedSprint);
  }

  async deleteSprint(
    workspaceSlug: string,
    projectSlug: string,
    sprintId: string,
  ) {
    const project = await this.getProject(workspaceSlug, projectSlug);

    const sprint = await this.prisma.sprint.findFirst({
      where: {
        id: sprintId,
        project_id: project.id,
        deleted_at: null,
      },
    });

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    await this.prisma.$transaction([
      this.prisma.sprint.update({
        where: {
          id: sprint.id,
        },
        data: {
          deleted_at: new Date(),
        },
      }),

      this.prisma.task.updateMany({
        where: {
          project_id: project.id,
          sprint_id: sprint.id,
        },
        data: {
          sprint_id: null,
        },
      }),
    ]);

    return {
      success: true,
    };
  }

  async addTaskToSprint(
    workspaceSlug: string,
    projectSlug: string,
    sprintId: string,
    taskId: string,
  ) {
    const project = await this.getProject(workspaceSlug, projectSlug);

    const sprint = await this.prisma.sprint.findFirst({
      where: {
        id: sprintId,
        project_id: project.id,
        deleted_at: null,
      },
    });

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        project_id: project.id,
        deleted_at: null,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const updatedTask = await this.prisma.task.update({
      where: {
        id: task.id,
      },
      data: {
        sprint_id: sprint.id,
      },
      select: {
        id: true,
        title: true,
        sprint_id: true,
      },
    });

    return {
      id: updatedTask.id,
      title: updatedTask.title,
      sprintId: updatedTask.sprint_id,
    };
  }

  async removeTaskFromSprint(
    workspaceSlug: string,
    projectSlug: string,
    taskId: string,
  ) {
    const project = await this.getProject(workspaceSlug, projectSlug);

    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        project_id: project.id,
        deleted_at: null,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const updatedTask = await this.prisma.task.update({
      where: {
        id: task.id,
      },
      data: {
        sprint_id: null,
      },
      select: {
        id: true,
        title: true,
        sprint_id: true,
      },
    });

    return {
      id: updatedTask.id,
      title: updatedTask.title,
      sprintId: updatedTask.sprint_id,
    };
  }

  private mapSprint(sprint: {
    id: string;
    name: string;
    goal: string | null;
    status: SprintStatus;
    start_date: Date;
    end_date: Date;
    completed_at: Date | null;
    project_id: string;
    created_at: Date;
    updated_at: Date | null;
  }) {
    return {
      id: sprint.id,
      name: sprint.name,
      goal: sprint.goal,
      status: sprint.status,
      startDate: sprint.start_date,
      endDate: sprint.end_date,
      completedAt: sprint.completed_at,
      projectId: sprint.project_id,
      createdAt: sprint.created_at,
      updatedAt: sprint.updated_at,
    };
  }

  private mapSprintWithStats(
    sprint: Prisma.SprintGetPayload<{
      include: {
        tasks: {
          select: {
            id: true;
            status: true;
          };
        };
      };
    }>,
  ) {
    const totalTasks = sprint.tasks.length;
    const doneTasks = sprint.tasks.filter(
      (task) => task.status === TaskStatus.Done,
    ).length;

    const progress =
      totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

    return {
      ...this.mapSprint(sprint),
      totalTasks,
      doneTasks,
      progress,
    };
  }
}
