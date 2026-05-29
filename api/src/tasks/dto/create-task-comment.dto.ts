import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTaskCommentDto {
  @IsUUID()
  @IsOptional()
  agentId?: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
