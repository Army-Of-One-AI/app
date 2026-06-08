import { Injectable, NotFoundException } from '@nestjs/common';
import PrismaService from 'src/shared/services/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskActivity, TaskPriority, TaskStatus } from 'generated/prisma/enums';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Prisma } from 'generated/prisma/browser';
import GetTaskActivitiesDto from '../workspaces/dto/get-task-activities.dto';
import { ClickHouseService } from '../click-house/click-house.service';
import { Epic } from 'generated/prisma/client';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clickhouseService: ClickHouseService,
  ) {}

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
      select: { id: true },
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
          project_id: project.id,
        },
      });

      void this.clickhouseService.insertTaskActivity({
        id: activity.id,
        taskId: activity.task_id,
        activity: activity.activity,
        userId: activity.user_id,
        createdAt: activity.created_at,
        projectId: activity.project_id,
        metadata: activity.metadata,
        actorAvatarSnapshot: activity.actor_avatar_snapshot ?? '',
        actorNameSnapshot: activity.actor_name_snapshot ?? '',
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
    const [user, project] = await this.prisma.$transaction([
      this.prisma.user.findFirst({
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
      }),

      this.prisma.project.findFirst({
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
          workspace_id: true,
          workspace: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      }),
    ]);

    if (!user || !project) {
      throw new NotFoundException('Resource not found');
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
        project_id: project.id,
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
        project_id: project.id,
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
        project_id: project.id,
        actor_avatar_snapshot: user.userInfo?.avatar_url || '',
        actor_name_snapshot: user.userInfo?.full_name || '',
        user_id: userId,
        metadata: {
          before: task.status,
          after: dto.status,
        },
      });
    }

    let nextAssigneeUsername: string | null = null;

    if (dto.assigneeId !== undefined && dto.assigneeId !== task.assignee_id) {
      if (dto.assigneeId !== null) {
        const nextAssignee = await this.prisma.user.findUnique({
          where: {
            id: dto.assigneeId,
          },
          select: {
            id: true,
            username: true,
          },
        });

        if (nextAssignee) {
          nextAssigneeUsername = nextAssignee.username;

          activities.push({
            task_id: task.id,
            project_id: project.id,
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
          project_id: project.id,
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
        project_id: project.id,
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
        project_id: project.id,
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

    const now = new Date();

    const finalActivities = activities.map((ac) => ({
      ...ac,
      id: crypto.randomUUID(),
      created_at: now,
    }));

    const shouldCreateAssignInboxItem =
      dto.assigneeId !== undefined &&
      dto.assigneeId !== null &&
      dto.assigneeId !== task.assignee_id &&
      dto.assigneeId !== userId;

    const operations: Prisma.PrismaPromise<unknown>[] = [
      this.prisma.task.update({
        where: { id: task.id },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
          ...(dto.status !== undefined && {
            status: dto.status,
            ...(dto.status === 'Done'
              ? { completed_at: new Date() }
              : { completed_at: null }),
          }),
          ...(dto.priority !== undefined && { priority: dto.priority }),
          ...(dto.estimate !== undefined && { estimate: dto.estimate }),
          ...(dto.dueDate !== undefined && { due_date: nextDueDate }),
          ...(dto.assigneeId !== undefined && {
            assignee_id: dto.assigneeId || null,
          }),
          ...(dto.parentTaskId !== undefined && {
            parent_task_id: dto.parentTaskId || null,
          }),
          ...(dto.epicId !== undefined && {
            epic_id: dto.epicId || null,
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

    if (finalActivities.length > 0) {
      operations.push(
        this.prisma.taskActivityLog.createMany({
          data: finalActivities,
        }),
      );
    }

    if (shouldCreateAssignInboxItem) {
      operations.push(
        this.prisma.inboxItem.create({
          data: {
            user_id: dto.assigneeId!,
            actor_id: userId,
            workspace_id: project.workspace_id,
            project_id: project.id,
            task_id: task.id,
            type: 'TASK_ASSIGNED',
            title: `You were assigned to ${task.title}`,
            message: `${user.userInfo?.full_name || 'Someone'} assigned you to a task`,
            metadata: {
              taskTitle: task.title,
              projectName: project.name,
              projectSlug: project.slug,
              workspaceName: project.workspace.name,
              workspaceSlug: project.workspace.slug,
              assigneeUsername: nextAssigneeUsername,
            },
          },
        }),
      );
    }

    const [updatedTask] = await this.prisma.$transaction(operations);

    void Promise.allSettled(
      finalActivities.map((ac) =>
        this.clickhouseService.insertTaskActivity({
          id: ac.id,
          activity: ac.activity,
          createdAt: ac.created_at,
          projectId: ac.project_id,
          taskId: ac.task_id,
          metadata: ac.metadata,
          userId: ac.user_id,
          actorAvatarSnapshot: ac.actor_avatar_snapshot ?? '',
          actorNameSnapshot: ac.actor_name_snapshot ?? '',
        }),
      ),
    ).then((results) => {
      results.forEach((result) => {
        if (result.status === 'rejected') {
          console.error('ClickHouse activity insert failed:', result.reason);
        }
      });
    });

    return updatedTask;
  }

  async getTasksByProjectSlug(projectSlug: string, workspaceSlug: string) {
    const tasks = await this.prisma.task.findMany({
      where: {
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
        epic: {
          select: {
            id: true,
            title: true,
            color: true,
          },
        },
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
        parent_task: {
          select: {
            id: true,
            title: true,
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

      epic: t.epic
        ? {
            id: t.epic.id,
            title: t.epic.title,
            color: t.epic.color,
          }
        : null,

      parentTask: t.parent_task
        ? {
            id: t.parent_task.id,
            title: t.parent_task.title,
          }
        : null,

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
        epic_id: true,
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

    let epic: Epic | null = null;

    if (t.epic_id) {
      epic = await this.prisma.epic.findUnique({
        where: {
          id: t.epic_id,
        },
      });
    }

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

      epic: epic
        ? {
            id: epic.id,
            title: epic.title,
            description: epic.description,
            createdAt: epic.created_at,
            color: epic.color,
            dueDate: epic.due_date,
            position: epic.position,
            startDate: epic.start_date,
          }
        : null,

      parentTask: t.parent_task,

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

  async getTaskActivities(
    taskId: string,
    projectSlug: string,
    query: GetTaskActivitiesDto,
  ) {
    const safeLimit = Math.min(
      100,
      Math.max(1, Number(query.limit ?? 20) || 20),
    );
    const cursor = query.cursor;

    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          slug: projectSlug,
        },
      },
      select: {
        id: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Resource not found');
    }

    const activities = await this.prisma.taskActivityLog.findMany({
      where: {
        task_id: taskId,
      },
      take: safeLimit + 1,
      ...(cursor
        ? {
            cursor: {
              id: cursor,
            },
            skip: 1,
          }
        : {}),
      orderBy: [
        {
          created_at: 'desc',
        },
        {
          id: 'desc',
        },
      ],
    });

    const hasMore = activities.length > safeLimit;
    const items = hasMore ? activities.slice(0, safeLimit) : activities;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return {
      items: items.map((ac) => ({
        id: ac.id,
        activity: ac.activity,
        createdAt: ac.created_at,
        metadata: ac.metadata,
        actor: {
          id: ac.user_id,
          fullName: ac.actor_name_snapshot,
          avatarURL: ac.actor_avatar_snapshot,
        },
      })),
      pagination: {
        limit: safeLimit,
        hasMore,
        nextCursor,
      },
    };
  }
}
