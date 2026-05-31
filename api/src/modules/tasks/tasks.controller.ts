import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '../../../generated/prisma/client.cjs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TaskResponseDto } from '../common/dto/response.dto';
import type { JwtUser } from '../common/types/auth.types';
import {
  CreateTaskDto,
  ProjectTaskParamDto,
  TaskIdParamDto,
  TaskQueryDto,
  UpdateTaskAssigneeDto,
  UpdateTaskDto,
  UpdateTaskPositionDto,
  UpdateTaskStatusDto,
} from './dto/task.dto';
import { TasksService } from './tasks.service';

@UseGuards(JwtAuthGuard)
@Controller()
@ApiTags('Tasks')
@ApiBearerAuth('access-token')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('projects/:projectId/tasks')
  @ApiOperation({ summary: 'Create task in project' })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  @ApiBody({
    type: CreateTaskDto,
    examples: {
      task: {
        value: {
          title: 'Design kanban task drag and drop',
          description: { text: 'Support status lanes and ordering.' },
          status: 'Todo',
          priority: 'High',
          estimate: 8,
          due_date: '2026-06-30T00:00:00.000Z',
          position: 1000,
        },
      },
    },
  })
  @ApiOkResponse({ type: TaskResponseDto })
  create(
    @CurrentUser() user: JwtUser,
    @Param() params: ProjectTaskParamDto,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(user.sub, params.projectId, dto);
  }

  @Get('projects/:projectId/tasks')
  @ApiOperation({ summary: 'List tasks by project' })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  @ApiQuery({ name: 'status', enum: TaskStatus, required: false })
  @ApiQuery({ name: 'priority', enum: TaskPriority, required: false })
  @ApiQuery({ name: 'assignee_id', required: false, format: 'uuid' })
  @ApiQuery({ name: 'due_date', required: false, example: '2026-06-30T00:00:00.000Z' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false, example: 'kanban' })
  @ApiQuery({
    name: 'orderBy',
    enum: ['position', 'due_date', 'created_at'],
    required: false,
  })
  @ApiOkResponse({ type: TaskResponseDto, isArray: true })
  findByProject(
    @CurrentUser() user: JwtUser,
    @Param() params: ProjectTaskParamDto,
    @Query() query: TaskQueryDto,
  ) {
    return this.tasksService.findByProject(user.sub, params.projectId, query);
  }

  @Get('tasks/:taskId')
  @ApiOperation({ summary: 'Get task detail' })
  @ApiParam({ name: 'taskId', format: 'uuid' })
  @ApiOkResponse({ type: TaskResponseDto })
  findOne(@CurrentUser() user: JwtUser, @Param() params: TaskIdParamDto) {
    return this.tasksService.findOne(user.sub, params.taskId);
  }

  @Patch('tasks/:taskId')
  @ApiOperation({ summary: 'Update task' })
  @ApiParam({ name: 'taskId', format: 'uuid' })
  @ApiBody({ type: UpdateTaskDto })
  @ApiOkResponse({ type: TaskResponseDto })
  update(
    @CurrentUser() user: JwtUser,
    @Param() params: TaskIdParamDto,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(user.sub, params.taskId, dto);
  }

  @Delete('tasks/:taskId')
  @ApiOperation({ summary: 'Soft delete task' })
  @ApiParam({ name: 'taskId', format: 'uuid' })
  @ApiOkResponse({ type: TaskResponseDto })
  remove(@CurrentUser() user: JwtUser, @Param() params: TaskIdParamDto) {
    return this.tasksService.remove(user.sub, params.taskId);
  }

  @Patch('tasks/:taskId/status')
  @ApiOperation({ summary: 'Update task status' })
  @ApiParam({ name: 'taskId', format: 'uuid' })
  @ApiBody({ type: UpdateTaskStatusDto })
  @ApiOkResponse({ type: TaskResponseDto })
  updateStatus(
    @CurrentUser() user: JwtUser,
    @Param() params: TaskIdParamDto,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.tasksService.updateStatus(user.sub, params.taskId, dto);
  }

  @Patch('tasks/:taskId/assignee')
  @ApiOperation({ summary: 'Update task assignee' })
  @ApiParam({ name: 'taskId', format: 'uuid' })
  @ApiBody({ type: UpdateTaskAssigneeDto })
  @ApiOkResponse({ type: TaskResponseDto })
  updateAssignee(
    @CurrentUser() user: JwtUser,
    @Param() params: TaskIdParamDto,
    @Body() dto: UpdateTaskAssigneeDto,
  ) {
    return this.tasksService.updateAssignee(user.sub, params.taskId, dto);
  }

  @Patch('tasks/:taskId/position')
  @ApiOperation({ summary: 'Update task kanban position' })
  @ApiParam({ name: 'taskId', format: 'uuid' })
  @ApiBody({ type: UpdateTaskPositionDto })
  @ApiOkResponse({ type: TaskResponseDto })
  updatePosition(
    @CurrentUser() user: JwtUser,
    @Param() params: TaskIdParamDto,
    @Body() dto: UpdateTaskPositionDto,
  ) {
    return this.tasksService.updatePosition(user.sub, params.taskId, dto);
  }
}
