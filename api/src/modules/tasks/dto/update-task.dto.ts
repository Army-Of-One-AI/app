import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import { IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @IsOptional()
  @IsUUID()
  epicId?: string;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsUUID()
  sprintId?: string | null;
}
