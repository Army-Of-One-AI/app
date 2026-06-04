import { Injectable, NotFoundException } from '@nestjs/common';
import PrismaService from 'src/shared/services/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskActivity, TaskPriority, TaskStatus } from 'generated/prisma/enums';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Prisma } from 'generated/prisma/browser';

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

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findFirst({
        where: {
          id: userId,
        },
        select: {
          userInfo: {
            select: {
              full_name: true,
              avatar_url: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const task = await tx.task.create({
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

      const activity = await tx.taskActivityLog.create({
        data: {
          activity: 'TASK_CREATED',
          task_id: task.id,
          user_id: userId,
          actor_name_snapshot: user.userInfo?.full_name || '',
          actor_avatar_snapshot: user.userInfo?.avatar_url || '',
        },
      });

      return { task, activity };
    });

    const { task } = result;

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

  async updateTask(
    userId: string,
    workspaceSlug: string,
    projectSlug: string,
    taskId: string,
    dto: UpdateTaskDto,
  ) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
      select: {
        userInfo: {
          select: {
            full_name: true,
            avatar_url: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        deleted_at: null,
        project: {
          slug: projectSlug,
          deleted_at: null,
          workspace: {
            slug: workspaceSlug,
          },
        },
      },
      select: {
        id: true,
        project_id: true,
        description: true,
        title: true,
        status: true,
        assignee_id: true,
        priority: true,
        due_date: true,
        assignee: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const activities: Prisma.TaskActivityLogCreateManyInput[] = [];

    if (dto.title !== undefined && dto.title !== task.title) {
      activities.push({
        task_id: task.id,
        actor_avatar_snapshot: user.userInfo?.avatar_url || '',
        actor_name_snapshot: user.userInfo?.full_name || '',
        user_id: userId,
        activity: TaskActivity.TITLE_CHANGED,
        metadata: {
          before: task.title,
          after: dto.title,
        },
      });
    }

    const currentDescription = task.description as {
      html: string;
      plainText: string;
    } | null;

    if (
      dto.description !== undefined &&
      dto.description?.plainText !== currentDescription?.plainText
    ) {
      activities.push({
        task_id: task.id,
        activity: TaskActivity.DESCRIPTION_UPDATED,
        user_id: userId,
        actor_avatar_snapshot: user.userInfo?.avatar_url || '',
        actor_name_snapshot: user.userInfo?.full_name || '',
        metadata: {
          before: currentDescription?.plainText ?? '',
          after: dto.description?.plainText ?? '',
        },
      });
    }

    if (dto.status !== undefined && dto.status !== task.status) {
      activities.push({
        task_id: task.id,
        activity: TaskActivity.STATUS_CHANGED,
        actor_avatar_snapshot: user.userInfo?.avatar_url || '',
        actor_name_snapshot: user.userInfo?.full_name || '',
        user_id: userId,
        metadata: {
          before: task.status,
          after: dto.status,
        },
      });
    }

    if (dto.assigneeId !== undefined && dto.assigneeId !== task.assignee_id) {
      if (dto.assigneeId !== null) {
        const nextAssignee = await this.prisma.user.findUnique({
          where: {
            id: dto.assigneeId,
          },
        });

        if (nextAssignee) {
          activities.push({
            task_id: task.id,
            activity: TaskActivity.ASSIGNEE_CHANGED,
            actor_avatar_snapshot: user.userInfo?.avatar_url || '',
            actor_name_snapshot: user.userInfo?.full_name || '',
            user_id: userId,
            metadata: {
              before: task.assignee?.username || '',
              after: nextAssignee.username,
            },
          });
        }
      } else {
        activities.push({
          task_id: task.id,
          activity: TaskActivity.ASSIGNEE_CHANGED,
          actor_avatar_snapshot: user.userInfo?.avatar_url || '',
          actor_name_snapshot: user.userInfo?.full_name || '',
          user_id: userId,
          metadata: {
            before: task.assignee?.username || '',
            after: '',
          },
        });
      }
    }

    if (dto.priority !== undefined && dto.priority !== task.priority) {
      activities.push({
        task_id: task.id,
        activity: TaskActivity.PRIORITY_CHANGED,
        actor_avatar_snapshot: user.userInfo?.avatar_url || '',
        actor_name_snapshot: user.userInfo?.full_name || '',
        user_id: userId,
        metadata: {
          before: task.priority,
          after: dto.priority,
        },
      });
    }

    const nextDueDate =
      dto.dueDate !== undefined
        ? dto.dueDate
          ? new Date(dto.dueDate)
          : null
        : undefined;

    const currentDueTime = task.due_date?.getTime() ?? null;
    const nextDueTime = nextDueDate?.getTime() ?? null;

    if (dto.dueDate !== undefined && currentDueTime !== nextDueTime) {
      activities.push({
        task_id: task.id,
        activity: TaskActivity.DUE_DATE_CHANGED,
        actor_avatar_snapshot: user.userInfo?.avatar_url || '',
        actor_name_snapshot: user.userInfo?.full_name || '',
        user_id: userId,
        metadata: {
          before: task.due_date?.toISOString() ?? null,
          after: nextDueDate?.toISOString() ?? null,
        },
      });
    }

    const operations: Prisma.PrismaPromise<unknown>[] = [
      this.prisma.task.update({
        where: {
          id: task.id,
        },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.priority !== undefined && { priority: dto.priority }),
          ...(dto.estimate !== undefined && { estimate: dto.estimate }),
          ...(dto.dueDate !== undefined && {
            due_date: nextDueDate,
          }),
          ...(dto.assigneeId !== undefined && {
            assignee_id: dto.assigneeId || null,
          }),
          ...(dto.parentTaskId !== undefined && {
            parent_task_id: dto.parentTaskId || null,
          }),
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
      }),
    ];

    if (activities.length > 0) {
      operations.push(
        this.prisma.taskActivityLog.createMany({
          data: activities,
        }),
      );
    }
    const [updatedTask] = await this.prisma.$transaction(operations);

    return updatedTask;
  }

  async getTasksByProjectSlug(projectSlug: string, workspaceSlug: string) {
    const tasks = await this.prisma.task.findMany({
      where: {
        parent_task_id: null,
        deleted_at: null,
        archived_at: null,
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

  async getTaskById(id: string, projectSlug: string) {
    const t = await this.prisma.task.findFirst({
      where: {
        id,
        deleted_at: null,
        archived_at: null,
        project: {
          slug: projectSlug,
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
        parent_task: {
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
                username: true,
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
                username: true,
                userInfo: {
                  select: {
                    avatar_url: true,
                    full_name: true,
                  },
                },
              },
            },
          },
        },
        sub_tasks: {
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
                username: true,
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
                username: true,
                userInfo: {
                  select: {
                    avatar_url: true,
                    full_name: true,
                  },
                },
              },
            },
          },
        },
        assignee: {
          select: {
            id: true,
            email: true,
            username: true,
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
            username: true,
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

    if (!t) {
      throw new NotFoundException('Task not found');
    }

    const activities = await this.prisma.taskActivityLog.findMany({
      where: {
        task_id: t.id,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return {
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

      parentTask: t.parent_task,

      activities: activities.map((a) => ({
        id: a.id,
        activity: a.activity,
        actor: {
          id: a.user_id,
          avatar: a.actor_avatar_snapshot,
          fullName: a.actor_name_snapshot,
        },
        metadata: a.metadata,
        createdAt: a.created_at,
      })),

      subtasks: t.sub_tasks.map((st) => ({
        id: st.id,
        title: st.title,
        description: st.description,
        completedAt: st.completed_at,
        createdAt: st.created_at,
        dueDate: st.due_date,
        estimate: st.estimate,
        priority: st.priority,
        position: st.position,
        status: st.status,
        startedAt: st.started_at,
        assignee: st.assignee
          ? {
              id: st.assignee.id,
              email: st.assignee.email,
              username: st.assignee.username,
              fullName: st.assignee.userInfo?.full_name ?? null,
              avatarURL: st.assignee.userInfo?.avatar_url ?? null,
            }
          : null,

        creator: st.creator
          ? {
              id: st.creator.id,
              email: st.creator.email,
              username: st.creator.username,
              fullName: st.creator.userInfo?.full_name ?? null,
              avatarURL: st.creator.userInfo?.avatar_url ?? null,
            }
          : null,
      })),

      assignee: t.assignee
        ? {
            id: t.assignee.id,
            email: t.assignee.email,
            username: t.assignee.username,
            fullName: t.assignee.userInfo?.full_name ?? null,
            avatarURL: t.assignee.userInfo?.avatar_url ?? null,
          }
        : null,

      creator: t.creator
        ? {
            id: t.creator.id,
            email: t.creator.email,
            username: t.creator.username,
            fullName: t.creator.userInfo?.full_name ?? null,
            avatarURL: t.creator.userInfo?.avatar_url ?? null,
          }
        : null,
    };
  }

  async deleteTask(taskId: string, projectSlug: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          slug: projectSlug,
        },
        deleted_at: null,
      },
      select: {
        id: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.prisma.task.updateMany({
      where: {
        OR: [{ id: taskId }, { parent_task_id: taskId }],
      },
      data: {
        deleted_at: new Date(),
      },
    });

    return { success: true };
  }

  async archiveTask(taskId: string, projectSlug: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          slug: projectSlug,
        },
        deleted_at: null,
      },
      select: {
        id: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.prisma.task.updateMany({
      where: {
        OR: [{ id: taskId }, { parent_task_id: taskId }],
      },
      data: {
        archived_at: new Date(),
      },
    });

    return { success: true };
  }

  async unarchiveTask(taskId: string, projectSlug: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          slug: projectSlug,
        },
        deleted_at: null,
      },
      select: {
        id: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.prisma.task.updateMany({
      where: {
        OR: [{ id: taskId }, { parent_task_id: taskId }],
      },
      data: {
        archived_at: null,
      },
    });

    return { success: true };
  }
}
