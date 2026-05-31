import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DocumentStatus,
  ProjectRole,
  TaskPriority,
  TaskStatus,
  TeamRole,
  WorkspaceRole,
} from '../../../../generated/prisma/client.cjs';

export class UserInfoResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ example: 'Ada Lovelace' })
  full_name?: string;

  @ApiPropertyOptional({ example: 'Product Manager' })
  title?: string;

  @ApiPropertyOptional({ example: '+15551234567' })
  phone_no?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  avatar_url?: string;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'ada' })
  username: string;

  @ApiProperty({ example: 'ada@example.com' })
  email: string;

  @ApiProperty()
  is_active: boolean;

  @ApiPropertyOptional({ type: UserInfoResponseDto })
  userInfo?: UserInfoResponseDto;
}

export class WorkspaceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Acme Product Team' })
  name: string;

  @ApiProperty({ example: 'acme-product-team' })
  slug: string;

  @ApiPropertyOptional()
  logo_url?: string;
}

export class WorkspaceMemberResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: WorkspaceRole })
  role: WorkspaceRole;

  @ApiProperty()
  workspace_id: string;

  @ApiProperty()
  member_id: string;
}

export class TeamResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Platform Engineering' })
  name: string;

  @ApiProperty({ example: 'platform-engineering' })
  slug: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  icon_url?: string;

  @ApiProperty()
  workspace_id: string;
}

export class TeamMemberResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: TeamRole })
  role: TeamRole;

  @ApiProperty()
  team_id: string;

  @ApiProperty()
  member_id: string;
}

export class ProjectResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'AI Sprint Planner' })
  name: string;

  @ApiProperty({ example: 'ai-sprint-planner' })
  slug: string;

  @ApiPropertyOptional({ type: Object })
  description?: object;

  @ApiProperty()
  workspace_id: string;
}

export class ProjectMemberResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: ProjectRole })
  role: ProjectRole;

  @ApiProperty()
  project_id: string;

  @ApiProperty()
  member_id: string;
}

export class TaskResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Design kanban task drag and drop' })
  title: string;

  @ApiPropertyOptional({ type: Object })
  description?: object;

  @ApiProperty({ enum: TaskStatus })
  status: TaskStatus;

  @ApiProperty({ enum: TaskPriority })
  priority: TaskPriority;

  @ApiProperty()
  project_id: string;

  @ApiProperty()
  creator_id: string;

  @ApiPropertyOptional()
  assignee_id?: string;

  @ApiProperty({ example: '1000' })
  position: string;
}

export class DocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Project Brief' })
  title: string;

  @ApiProperty({ example: 'project-brief' })
  slug: string;

  @ApiPropertyOptional({ type: Object })
  content?: object;

  @ApiProperty({ enum: DocumentStatus })
  status: DocumentStatus;

  @ApiProperty()
  project_id: string;

  @ApiProperty()
  creator_id: string;
}
