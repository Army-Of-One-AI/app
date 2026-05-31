import {
  TaskPriority,
  TaskStatus,
} from '../../../../generated/prisma/client.cjs';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ProjectTaskParamDto {
  @ApiProperty({ example: '0f8fad5b-d9cb-469f-a165-70867728950e' })
  @IsUUID()
  projectId: string;
}

export class TaskIdParamDto {
  @ApiProperty({ example: '0f8fad5b-d9cb-469f-a165-70867728950e' })
  @IsUUID()
  taskId: string;
}

export class CreateTaskDto {
  @ApiProperty({ example: 'Design kanban task drag and drop' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: { blocks: [{ type: 'paragraph', text: 'Acceptance criteria...' }] } })
  @IsOptional()
  @IsObject()
  description?: object;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.Todo })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.High })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: 8, minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  estimate?: number;

  @ApiPropertyOptional({ example: '2026-06-30T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  due_date?: string;

  @ApiPropertyOptional({ example: '0f8fad5b-d9cb-469f-a165-70867728950e' })
  @IsOptional()
  @IsUUID()
  assignee_id?: string;

  @ApiPropertyOptional({ example: '0f8fad5b-d9cb-469f-a165-70867728950e' })
  @IsOptional()
  @IsUUID()
  parent_task_id?: string;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  position?: number;
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Design kanban board interactions' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: { blocks: [{ type: 'paragraph', text: 'Updated details...' }] } })
  @IsOptional()
  @IsObject()
  description?: object;

  @ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.Urgent })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: 13, minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  estimate?: number;

  @ApiPropertyOptional({ example: '2026-07-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  due_date?: string;
}

export class UpdateTaskStatusDto {
  @ApiProperty({ enum: TaskStatus, example: TaskStatus.InProgress })
  @IsEnum(TaskStatus)
  status: TaskStatus;
}

export class UpdateTaskAssigneeDto {
  @ApiPropertyOptional({
    example: '0f8fad5b-d9cb-469f-a165-70867728950e',
    description: 'Set to null or omit to unassign the task',
  })
  @IsOptional()
  @IsUUID()
  assignee_id?: string;
}

export class UpdateTaskPositionDto {
  @ApiProperty({ example: 2000 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  position: number;
}

export class TaskQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.Todo })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ example: '0f8fad5b-d9cb-469f-a165-70867728950e' })
  @IsOptional()
  @IsUUID()
  assignee_id?: string;

  @ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.High })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: '2026-06-30T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  due_date?: string;

  @ApiPropertyOptional({
    enum: ['position', 'due_date', 'created_at'],
    example: 'position',
  })
  @IsOptional()
  @IsEnum(['position', 'due_date', 'created_at'])
  orderBy?: 'position' | 'due_date' | 'created_at';
}
