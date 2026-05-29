import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgentRolesService } from '../agent-roles/agent-roles.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agentRolesService: AgentRolesService,
  ) {}

  async create(dto: CreateWorkspaceDto) {
    const existing = await this.prisma.workspace.findUnique({
      where: { slug: dto.slug },
    });
    if (existing)
      throw new BadRequestException('Workspace slug already exists');

    const workspace = await this.prisma.workspace.create({ data: dto });
    await this.agentRolesService.createDefaultAgentRoles(workspace.id);
    return this.findOne(workspace.id);
  }

  findAll() {
    return this.prisma.workspace.findMany({
      include: { projects: true, agents: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: { projects: true, agents: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  async update(id: string, dto: UpdateWorkspaceDto) {
    await this.findOne(id);

    if (dto.slug) {
      const existing = await this.prisma.workspace.findUnique({
        where: { slug: dto.slug },
      });
      if (existing && existing.id !== id)
        throw new BadRequestException('Workspace slug already exists');
    }

    return this.prisma.workspace.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.workspace.delete({ where: { id } });
  }
}
