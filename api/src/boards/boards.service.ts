import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { CreateBoardColumnDto } from './dto/create-board-column.dto';
import { ReorderBoardColumnsDto } from './dto/reorder-board-columns.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { UpdateBoardColumnDto } from './dto/update-board-column.dto';

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBoardDto) {
    await this.ensureProject(dto.projectId);
    return this.prisma.board.create({
      data: { project_id: dto.projectId, name: dto.name },
      include: { columns: { orderBy: { order: 'asc' } } },
    });
  }

  findByProject(projectId: string) {
    return this.prisma.board.findMany({
      where: { project_id: projectId },
      include: { columns: { orderBy: { order: 'asc' } } },
      orderBy: { created_at: 'asc' },
    });
  }

  async findOne(id: string) {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: { tasks: { orderBy: { order: 'asc' } } },
        },
      },
    });
    if (!board) throw new NotFoundException('Board not found');
    return board;
  }

  async update(id: string, dto: UpdateBoardDto) {
    await this.findOne(id);
    return this.prisma.board.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.board.delete({ where: { id } });
  }

  async createColumn(boardId: string, dto: CreateBoardColumnDto) {
    await this.findOne(boardId);
    const order = dto.order ?? (await this.nextColumnOrder(boardId));
    return this.prisma.boardColumn.create({
      data: { board_id: boardId, name: dto.name, order },
    });
  }

  async updateColumn(columnId: string, dto: UpdateBoardColumnDto) {
    await this.findColumn(columnId);
    return this.prisma.boardColumn.update({
      where: { id: columnId },
      data: { name: dto.name, order: dto.order },
    });
  }

  async removeColumn(columnId: string) {
    await this.findColumn(columnId);
    return this.prisma.boardColumn.delete({ where: { id: columnId } });
  }

  async reorderColumns(boardId: string, dto: ReorderBoardColumnsDto) {
    await this.findOne(boardId);
    const columns = await this.prisma.boardColumn.findMany({
      where: { board_id: boardId },
    });
    const actualIds = new Set(columns.map((column) => column.id));
    const requestedIds = new Set(dto.columnIds);

    if (
      columns.length !== dto.columnIds.length ||
      dto.columnIds.some((id) => !actualIds.has(id))
    ) {
      throw new BadRequestException('Column ids must match the board columns');
    }
    if (requestedIds.size !== dto.columnIds.length)
      throw new BadRequestException('Column ids must be unique');

    await this.prisma.$transaction(
      dto.columnIds.map((id, order) =>
        this.prisma.boardColumn.update({
          where: { id },
          data: { order },
        }),
      ),
    );

    return this.findOne(boardId);
  }

  private async ensureProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new BadRequestException('Project not found');
  }

  private async findColumn(columnId: string) {
    const column = await this.prisma.boardColumn.findUnique({
      where: { id: columnId },
    });
    if (!column) throw new NotFoundException('Board column not found');
    return column;
  }

  private async nextColumnOrder(boardId: string) {
    const aggregate = await this.prisma.boardColumn.aggregate({
      where: { board_id: boardId },
      _max: { order: true },
    });
    return (aggregate._max.order ?? -1) + 1;
  }
}
