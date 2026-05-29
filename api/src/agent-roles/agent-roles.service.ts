import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AgentRoleType } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentRoleDto } from './dto/create-agent-role.dto';
import { UpdateAgentRoleDto } from './dto/update-agent-role.dto';

const DEFAULT_AGENT_ROLES: Array<{
  name: string;
  role: AgentRoleType;
  system_prompt: string;
}> = [
  {
    name: 'PM',
    role: AgentRoleType.PM,
    system_prompt: 'Act as a pragmatic product manager.',
  },
  {
    name: 'Developer',
    role: AgentRoleType.DEVELOPER,
    system_prompt: 'Act as a senior software developer.',
  },
  {
    name: 'Designer',
    role: AgentRoleType.DESIGNER,
    system_prompt: 'Act as a product designer.',
  },
  {
    name: 'QC',
    role: AgentRoleType.QC,
    system_prompt: 'Act as a quality control engineer.',
  },
  {
    name: 'DevOps',
    role: AgentRoleType.DEVOPS,
    system_prompt: 'Act as a DevOps engineer.',
  },
  {
    name: 'Writer',
    role: AgentRoleType.WRITER,
    system_prompt: 'Act as a technical writer.',
  },
  {
    name: 'Support',
    role: AgentRoleType.SUPPORT,
    system_prompt: 'Act as a customer support specialist.',
  },
];

@Injectable()
export class AgentRolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAgentRoleDto) {
    await this.ensureWorkspace(dto.workspaceId);
    await this.ensureModelProvider(dto.modelProviderId);

    return this.prisma.agentRole.create({
      data: {
        workspace_id: dto.workspaceId,
        name: dto.name,
        role: dto.role,
        description: dto.description,
        system_prompt: dto.systemPrompt,
        model_provider_id: dto.modelProviderId,
      },
      include: { model_provider: true },
    });
  }

  findAll(workspaceId?: string) {
    return this.prisma.agentRole.findMany({
      where: workspaceId ? { workspace_id: workspaceId } : undefined,
      include: { model_provider: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const agent = await this.prisma.agentRole.findUnique({
      where: { id },
      include: { model_provider: true },
    });
    if (!agent) throw new NotFoundException('Agent role not found');
    return agent;
  }

  async update(id: string, dto: UpdateAgentRoleDto) {
    await this.findOne(id);
    await this.ensureModelProvider(dto.modelProviderId);

    return this.prisma.agentRole.update({
      where: { id },
      data: {
        name: dto.name,
        role: dto.role,
        description: dto.description,
        system_prompt: dto.systemPrompt,
        model_provider_id: dto.modelProviderId,
      },
      include: { model_provider: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.agentRole.delete({ where: { id } });
  }

  async createDefaultAgentRoles(workspaceId: string) {
    await this.ensureWorkspace(workspaceId);

    return this.prisma.$transaction(
      DEFAULT_AGENT_ROLES.map((role) =>
        this.prisma.agentRole.create({
          data: {
            workspace_id: workspaceId,
            name: role.name,
            role: role.role,
            system_prompt: role.system_prompt,
          },
        }),
      ),
    );
  }

  private async ensureWorkspace(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) throw new BadRequestException('Workspace not found');
  }

  private async ensureModelProvider(modelProviderId?: string) {
    if (!modelProviderId) return;
    const provider = await this.prisma.modelProvider.findUnique({
      where: { id: modelProviderId },
    });
    if (!provider) throw new BadRequestException('Model provider not found');
  }
}
