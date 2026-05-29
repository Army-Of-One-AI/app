import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { TaskPriority, TaskStatus } from '../../generated/prisma/client';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @IsUUID()
  @IsOptional()
  columnId?: string;

  @IsUUID()
  @IsOptional()
  assigneeRoleId?: string;

  @IsUUID()
  @IsOptional()
  createdByAgentId?: string;

  @IsString()
  @IsOptional()
  acceptanceCriteria?: string;

  @IsString()
  @IsOptional()
  technicalNotes?: string;

  @IsString()
  @IsOptional()
  testCases?: string;
}
