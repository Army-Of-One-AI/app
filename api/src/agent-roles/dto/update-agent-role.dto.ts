import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AgentRoleType } from '../../generated/prisma/client';

export class UpdateAgentRoleDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  name?: string;

  @IsEnum(AgentRoleType)
  @IsOptional()
  role?: AgentRoleType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  systemPrompt?: string;

  @IsUUID()
  @IsOptional()
  modelProviderId?: string;
}
