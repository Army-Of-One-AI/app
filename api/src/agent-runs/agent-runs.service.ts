import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AgentRunStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentRunDto } from './dto/create-agent-run.dto';

@Injectable()
export class AgentRunsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAgentRunDto) {
    await this.ensureAgent(dto.agentId);
    await this.ensureTask(dto.taskId);

    const startedAt = new Date();
    const run = await this.prisma.agentRun.create({
      data: {
        agent_id: dto.agentId,
        task_id: dto.taskId,
        input: dto.input,
        status: AgentRunStatus.RUNNING,
        started_at: startedAt,
      },
      include: { agent: true, task: true },
    });

    const output = await this.runAgent(dto);

    return this.prisma.agentRun.update({
      where: { id: run.id },
      data: {
        output,
        status: AgentRunStatus.SUCCESS,
        finished_at: new Date(),
      },
      include: { agent: true, task: true },
    });
  }

  findAll(taskId?: string, agentId?: string) {
    return this.prisma.agentRun.findMany({
      where: {
        task_id: taskId,
        agent_id: agentId,
      },
      include: { agent: true, task: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const run = await this.prisma.agentRun.findUnique({
      where: { id },
      include: { agent: true, task: true },
    });
    if (!run) throw new NotFoundException('Agent run not found');
    return run;
  }

  private async runAgent(dto: CreateAgentRunDto) {
    return `Placeholder AI output for agent ${dto.agentId}: ${dto.input}`;
  }

  private async ensureAgent(agentId: string) {
    const agent = await this.prisma.agentRole.findUnique({
      where: { id: agentId },
    });
    if (!agent) throw new BadRequestException('Agent role not found');
  }

  private async ensureTask(taskId?: string) {
    if (!taskId) return;
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new BadRequestException('Task not found');
  }
}
