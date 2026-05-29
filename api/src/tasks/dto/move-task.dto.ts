import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { TaskStatus } from '../../generated/prisma/client';

export class MoveTaskDto {
  @IsUUID()
  columnId: string;

  @IsInt()
  @Min(0)
  order: number;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
