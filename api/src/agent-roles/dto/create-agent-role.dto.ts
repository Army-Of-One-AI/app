import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AgentRoleType } from '../../generated/prisma/client';

export class CreateAgentRoleDto {
  @IsUUID()
  workspaceId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsEnum(AgentRoleType)
  role: AgentRoleType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  systemPrompt: string;

  @IsUUID()
  @IsOptional()
  modelProviderId?: string;
}
