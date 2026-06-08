import { IsString, IsUUID } from 'class-validator';

export class AddTaskToSprintDto {
  @IsString()
  @IsUUID()
  taskId: string;
}
