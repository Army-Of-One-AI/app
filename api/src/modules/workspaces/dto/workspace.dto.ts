import { WorkspaceRole } from '../../../../generated/prisma/client.cjs';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class WorkspaceIdParamDto {
  @ApiProperty({ example: '0f8fad5b-d9cb-469f-a165-70867728950e' })
  @IsUUID()
  workspaceId: string;
}

export class WorkspaceMemberParamDto extends WorkspaceIdParamDto {
  @ApiProperty({ example: '1', description: 'Workspace member id or user id' })
  @IsString()
  memberId: string;
}

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'Acme Product Team' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ example: 'acme-product-team' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  slug?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  logo_url?: string;
}

export class UpdateWorkspaceDto {
  @ApiPropertyOptional({ example: 'Acme Platform Team' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'https://example.com/new-logo.png' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  logo_url?: string;
}

export class AddWorkspaceMemberDto {
  @ApiProperty({ example: '0f8fad5b-d9cb-469f-a165-70867728950e' })
  @IsUUID()
  user_id: string;

  @ApiPropertyOptional({ enum: WorkspaceRole, example: WorkspaceRole.Member })
  @IsOptional()
  @IsEnum(WorkspaceRole)
  role?: WorkspaceRole;
}

export class UpdateWorkspaceMemberDto {
  @ApiProperty({ enum: WorkspaceRole, example: WorkspaceRole.Admin })
  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;
}

export class WorkspaceQueryDto extends PaginationQueryDto {}
