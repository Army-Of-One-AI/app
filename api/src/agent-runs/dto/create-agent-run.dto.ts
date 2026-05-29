import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAgentRunDto {
  @IsUUID()
  agentId: string;

  @IsUUID()
  @IsOptional()
  taskId?: string;

  @IsString()
  @IsNotEmpty()
  input: string;
}
