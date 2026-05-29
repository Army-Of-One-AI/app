import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TaskStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTaskDto) {
    await this.ensureProject(dto.projectId);
    if (dto.columnId)
      await this.ensureColumnBelongsToProject(dto.columnId, dto.projectId);
    await this.ensureAgent(dto.assigneeRoleId);
    await this.ensureAgent(dto.createdByAgentId);

    const order =
      dto.order ?? (dto.columnId ? await this.nextTaskOrder(dto.columnId) : 0);

    return this.prisma.task.create({
      data: {
        project_id: dto.projectId,
        column_id: dto.columnId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        status: dto.status,
        order,
        assignee_role_id: dto.assigneeRoleId,
        created_by_agent_id: dto.createdByAgentId,
        acceptance_criteria: dto.acceptanceCriteria,
        technical_notes: dto.technicalNotes,
        test_cases: dto.testCases,
      },
      include: this.taskInclude(),
    });
  }

  findAll(projectId?: string, boardId?: string, columnId?: string) {
    return this.prisma.task.findMany({
      where: {
        project_id: projectId,
        column_id: columnId,
        column: boardId ? { board_id: boardId } : undefined,
      },
      include: this.taskInclude(),
      orderBy: [{ order: 'asc' }, { created_at: 'desc' }],
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: this.taskInclude(),
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    const task = await this.findOne(id);
    if (dto.columnId)
      await this.ensureColumnBelongsToProject(dto.columnId, task.project_id);
    await this.ensureAgent(dto.assigneeRoleId);
    await this.ensureAgent(dto.createdByAgentId);

    return this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        status: dto.status,
        order: dto.order,
        column_id: dto.columnId,
        assignee_role_id: dto.assigneeRoleId,
        created_by_agent_id: dto.createdByAgentId,
        acceptance_criteria: dto.acceptanceCriteria,
        technical_notes: dto.technicalNotes,
        test_cases: dto.testCases,
      },
      include: this.taskInclude(),
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.task.delete({ where: { id } });
  }

  async move(id: string, dto: MoveTaskDto) {
    const task = await this.findOne(id);
    const column = await this.ensureColumnBelongsToProject(
      dto.columnId,
      task.project_id,
    );
    const status =
      dto.status ?? this.statusForColumnName(column.name) ?? task.status;

    await this.prisma.$transaction(async (tx) => {
      await tx.task.updateMany({
        where: {
          column_id: dto.columnId,
          id: { not: id },
          order: { gte: dto.order },
        },
        data: { order: { increment: 1 } },
      });

      await tx.task.update({
        where: { id },
        data: {
          column_id: dto.columnId,
          status,
          order: dto.order,
        },
      });
    });

    return this.findOne(id);
  }

  async createComment(taskId: string, dto: CreateTaskCommentDto) {
    await this.findOne(taskId);
    await this.ensureAgent(dto.agentId);

    return this.prisma.taskComment.create({
      data: {
        task_id: taskId,
        agent_id: dto.agentId,
        content: dto.content,
      },
      include: { agent: true },
    });
  }

  async findComments(taskId: string) {
    await this.findOne(taskId);
    return this.prisma.taskComment.findMany({
      where: { task_id: taskId },
      include: { agent: true },
      orderBy: { created_at: 'asc' },
    });
  }

  private async ensureProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new BadRequestException('Project not found');
  }

  private async ensureColumnBelongsToProject(
    columnId: string,
    projectId: string,
  ) {
    const column = await this.prisma.boardColumn.findUnique({
      where: { id: columnId },
      include: { board: true },
    });
    if (!column) throw new BadRequestException('Board column not found');
    if (column.board.project_id !== projectId)
      throw new BadRequestException('Column does not belong to task project');
    return column;
  }

  private async ensureAgent(agentId?: string) {
    if (!agentId) return;
    const agent = await this.prisma.agentRole.findUnique({
      where: { id: agentId },
    });
    if (!agent) throw new BadRequestException('Agent role not found');
  }

  private async nextTaskOrder(columnId: string) {
    const aggregate = await this.prisma.task.aggregate({
      where: { column_id: columnId },
      _max: { order: true },
    });
    return (aggregate._max.order ?? -1) + 1;
  }

  private statusForColumnName(name: string): TaskStatus | undefined {
    const normalized = name
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '_');
    return Object.values(TaskStatus).includes(normalized as TaskStatus)
      ? (normalized as TaskStatus)
      : undefined;
  }

  private taskInclude() {
    return {
      project: true,
      column: true,
      assignee_role: true,
      created_by_agent: true,
    };
  }
}
