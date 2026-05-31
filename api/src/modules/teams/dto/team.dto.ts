import { TeamRole } from '../../../../generated/prisma/client.cjs';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class WorkspaceTeamParamDto {
  @ApiProperty({ example: '0f8fad5b-d9cb-469f-a165-70867728950e' })
  @IsUUID()
  workspaceId: string;
}

export class TeamIdParamDto {
  @ApiProperty({ example: '0f8fad5b-d9cb-469f-a165-70867728950e' })
  @IsUUID()
  teamId: string;
}

export class TeamMemberParamDto extends TeamIdParamDto {
  @ApiProperty({ example: '1', description: 'Team member id or user id' })
  @IsString()
  memberId: string;
}

export class CreateTeamDto {
  @ApiProperty({ example: 'Platform Engineering' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ example: 'platform-engineering' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  slug?: string;

  @ApiPropertyOptional({ example: 'Core backend and infrastructure team' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/team-icon.png' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  icon_url?: string;
}

export class UpdateTeamDto {
  @ApiPropertyOptional({ example: 'Platform Team' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'Owns APIs and deployment pipelines' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/team-icon-v2.png' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  icon_url?: string;
}

export class AddTeamMemberDto {
  @ApiProperty({ example: '0f8fad5b-d9cb-469f-a165-70867728950e' })
  @IsUUID()
  user_id: string;

  @ApiPropertyOptional({ enum: TeamRole, example: TeamRole.Member })
  @IsOptional()
  @IsEnum(TeamRole)
  role?: TeamRole;
}

export class UpdateTeamMemberDto {
  @ApiProperty({ enum: TeamRole, example: TeamRole.Leader })
  @IsEnum(TeamRole)
  role: TeamRole;
}
