import { ProjectRole } from '../../../../generated/prisma/client.cjs';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class WorkspaceProjectParamDto {
  @ApiProperty({ example: '0f8fad5b-d9cb-469f-a165-70867728950e' })
  @IsUUID()
  workspaceId: string;
}

export class ProjectIdParamDto {
  @ApiProperty({ example: '0f8fad5b-d9cb-469f-a165-70867728950e' })
  @IsUUID()
  projectId: string;
}

export class ProjectMemberParamDto extends ProjectIdParamDto {
  @ApiProperty({ example: '1', description: 'Project member id or user id' })
  @IsString()
  memberId: string;
}

export class CreateProjectDto {
  @ApiProperty({ example: 'AI Sprint Planner' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ example: 'ai-sprint-planner' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  slug?: string;

  @ApiPropertyOptional({
    example: { summary: 'Plan and track AI-assisted delivery work' },
  })
  @IsOptional()
  @IsObject()
  description?: object;
}

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'AI Delivery Planner' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    example: { summary: 'Updated project scope and objectives' },
  })
  @IsOptional()
  @IsObject()
  description?: object;
}

export class AddProjectMemberDto {
  @ApiProperty({ example: '0f8fad5b-d9cb-469f-a165-70867728950e' })
  @IsUUID()
  user_id: string;

  @ApiPropertyOptional({ enum: ProjectRole, example: ProjectRole.Developer })
  @IsOptional()
  @IsEnum(ProjectRole)
  role?: ProjectRole;
}

export class UpdateProjectMemberDto {
  @ApiProperty({ enum: ProjectRole, example: ProjectRole.ProjectManager })
  @IsEnum(ProjectRole)
  role: ProjectRole;
}

export class ProjectQueryDto extends PaginationQueryDto {}
