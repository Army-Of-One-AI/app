import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const DEFAULT_BOARD_COLUMNS = [
  'Backlog',
  'Ready',
  'In Progress',
  'Review',
  'Testing',
  'Done',
];

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectDto) {
    await this.ensureWorkspace(dto.workspaceId);

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          workspace_id: dto.workspaceId,
          name: dto.name,
          description: dto.description,
        },
      });

      await this.createDefaultBoardColumns(tx, project.id);
      return tx.project.findUnique({
        where: { id: project.id },
        include: {
          boards: { include: { columns: { orderBy: { order: 'asc' } } } },
        },
      });
    });
  }

  findAll(workspaceId?: string) {
    return this.prisma.project.findMany({
      where: workspaceId ? { workspace_id: workspaceId } : undefined,
      include: { boards: true, tasks: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        workspace: true,
        boards: { include: { columns: { orderBy: { order: 'asc' } } } },
        tasks: true,
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);
    return this.prisma.project.update({
      where: { id },
      data: { name: dto.name, description: dto.description },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.project.delete({ where: { id } });
  }

  async createDefaultBoardColumns(
    tx: Prisma.TransactionClient,
    projectId: string,
  ) {
    const board = await tx.board.create({
      data: { project_id: projectId, name: 'Default Board' },
    });

    await tx.boardColumn.createMany({
      data: DEFAULT_BOARD_COLUMNS.map((name, order) => ({
        board_id: board.id,
        name,
        order,
      })),
    });

    return board;
  }

  private async ensureWorkspace(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) throw new BadRequestException('Workspace not found');
  }
}
