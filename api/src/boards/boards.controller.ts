import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { CreateBoardColumnDto } from './dto/create-board-column.dto';
import { ReorderBoardColumnsDto } from './dto/reorder-board-columns.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { UpdateBoardColumnDto } from './dto/update-board-column.dto';

@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  create(@Body() dto: CreateBoardDto) {
    return this.boardsService.create(dto);
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.boardsService.findByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.boardsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBoardDto) {
    return this.boardsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.boardsService.remove(id);
  }

  @Post(':boardId/columns')
  createColumn(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Body() dto: CreateBoardColumnDto,
  ) {
    return this.boardsService.createColumn(boardId, dto);
  }

  @Patch('columns/:columnId')
  updateColumn(
    @Param('columnId', ParseUUIDPipe) columnId: string,
    @Body() dto: UpdateBoardColumnDto,
  ) {
    return this.boardsService.updateColumn(columnId, dto);
  }

  @Delete('columns/:columnId')
  removeColumn(@Param('columnId', ParseUUIDPipe) columnId: string) {
    return this.boardsService.removeColumn(columnId);
  }

  @Patch(':boardId/columns/reorder')
  reorderColumns(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Body() dto: ReorderBoardColumnsDto,
  ) {
    return this.boardsService.reorderColumns(boardId, dto);
  }
}
