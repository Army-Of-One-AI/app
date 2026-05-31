import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProjectRole, TaskStatus } from '../../../generated/prisma/client.cjs';
import { AccessService } from '../common/services/access.service';
import { getPagination, paginated } from '../common/utils/pagination';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTaskDto,
  TaskQueryDto,
  UpdateTaskAssigneeDto,
  UpdateTaskDto,
  UpdateTaskPositionDto,
  UpdateTaskStatusDto,
} from './dto/task.dto';

const TASK_MANAGERS = [
  ProjectRole.Owner,
  ProjectRole.ProductOwner,
  ProjectRole.ProjectManager,
  ProjectRole.TechLead,
];

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async create(userId: string, projectId: string, dto: CreateTaskDto) {
    await this.access.assertProjectRole(userId, projectId, TASK_MANAGERS);
    await this.validateAssignee(projectId, dto.assignee_id);

    return this.prisma.task.create({
      data: {
        project_id: projectId,
        creator_id: userId,
        title: dto.title,
        description: dto.description ?? undefined,
        status: dto.status,
        priority: dto.priority,
        estimate: dto.estimate,
        due_date: dto.due_date ? new Date(dto.due_date) : undefined,
        assignee_id: dto.assignee_id,
        parent_task_id: dto.parent_task_id,
        position: dto.position,
      },
    });
  }

  async findByProject(userId: string, projectId: string, query: TaskQueryDto) {
    await this.access.assertProjectMember(userId, projectId);
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.TaskWhereInput = {
      project_id: projectId,
      deleted_at: null,
      status: query.status,
      assignee_id: query.assignee_id,
      priority: query.priority,
      ...(query.due_date ? { due_date: { lte: new Date(query.due_date) } } : {}),
      ...(query.search
        ? { title: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        skip,
        take,
        orderBy: { [query.orderBy ?? 'position']: 'asc' },
      }),
      this.prisma.task.count({ where }),
    ]);

    return paginated(data, total, page, limit);
  }

  async findOne(userId: string, taskId: string) {
    const task = await this.getActiveTask(taskId);
    await this.access.assertProjectMember(userId, task.project_id);
    return task;
  }

  async update(userId: string, taskId: string, dto: UpdateTaskDto) {
    const task = await this.getActiveTask(taskId);
    await this.access.assertProjectRole(userId, task.project_id, TASK_MANAGERS);

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...dto,
        due_date: dto.due_date ? new Date(dto.due_date) : undefined,
      },
    });
  }

  async remove(userId: string, taskId: string) {
    const task = await this.getActiveTask(taskId);
    await this.access.assertProjectRole(userId, task.project_id, TASK_MANAGERS);

    return this.prisma.task.update({
      where: { id: taskId },
      data: { deleted_at: new Date() },
    });
  }

  async updateStatus(userId: string, taskId: string, dto: UpdateTaskStatusDto) {
    const task = await this.getActiveTask(taskId);
    const isAssignee = task.assignee_id === userId;
    const canManage = await this.hasProjectRole(userId, task.project_id, TASK_MANAGERS);

    if (!isAssignee && !canManage) {
      throw new ForbiddenException('Insufficient task status permissions');
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: dto.status,
        started_at:
          dto.status === TaskStatus.InProgress && !task.started_at
            ? new Date()
            : undefined,
        completed_at: dto.status === TaskStatus.Done ? new Date() : undefined,
      },
    });
  }

  async updateAssignee(
    userId: string,
    taskId: string,
    dto: UpdateTaskAssigneeDto,
  ) {
    const task = await this.getActiveTask(taskId);
    await this.access.assertProjectRole(userId, task.project_id, TASK_MANAGERS);
    await this.validateAssignee(task.project_id, dto.assignee_id);

    return this.prisma.task.update({
      where: { id: taskId },
      data: { assignee_id: dto.assignee_id ?? null },
    });
  }

  async updatePosition(
    userId: string,
    taskId: string,
    dto: UpdateTaskPositionDto,
  ) {
    const task = await this.getActiveTask(taskId);
    await this.access.assertProjectRole(userId, task.project_id, TASK_MANAGERS);

    return this.prisma.task.update({
      where: { id: taskId },
      data: { position: dto.position },
    });
  }

  private async validateAssignee(projectId: string, assigneeId?: string) {
    if (!assigneeId) {
      return;
    }

    const member = await this.prisma.projectMember.findUnique({
      where: { project_id_member_id: { project_id: projectId, member_id: assigneeId } },
    });

    if (!member) {
      throw new BadRequestException('Assignee must be a project member');
    }
  }

  private async hasProjectRole(
    userId: string,
    projectId: string,
    roles: ProjectRole[],
  ) {
    const member = await this.prisma.projectMember.findUnique({
      where: { project_id_member_id: { project_id: projectId, member_id: userId } },
    });

    return !!member && roles.includes(member.role);
  }

  private async getActiveTask(taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, deleted_at: null },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }
}
