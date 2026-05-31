import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  ProjectMemberResponseDto,
  ProjectResponseDto,
} from '../common/dto/response.dto';
import type { JwtUser } from '../common/types/auth.types';
import {
  AddProjectMemberDto,
  CreateProjectDto,
  ProjectIdParamDto,
  ProjectMemberParamDto,
  ProjectQueryDto,
  UpdateProjectDto,
  UpdateProjectMemberDto,
  WorkspaceProjectParamDto,
} from './dto/project.dto';
import { ProjectsService } from './projects.service';

@UseGuards(JwtAuthGuard)
@Controller()
@ApiTags('Projects')
@ApiBearerAuth('access-token')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post('workspaces/:workspaceId/projects')
  @ApiOperation({ summary: 'Create project in workspace' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiBody({
    type: CreateProjectDto,
    examples: {
      project: {
        value: {
          name: 'AI Sprint Planner',
          slug: 'ai-sprint-planner',
          description: { summary: 'Plan and track AI-assisted delivery work' },
        },
      },
    },
  })
  @ApiOkResponse({ type: ProjectResponseDto })
  create(
    @CurrentUser() user: JwtUser,
    @Param() params: WorkspaceProjectParamDto,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(user.sub, params.workspaceId, dto);
  }

  @Get('workspaces/:workspaceId/projects')
  @ApiOperation({ summary: 'List projects in workspace' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false, example: 'sprint' })
  @ApiOkResponse({ type: ProjectResponseDto, isArray: true })
  findByWorkspace(
    @CurrentUser() user: JwtUser,
    @Param() params: WorkspaceProjectParamDto,
    @Query() query: ProjectQueryDto,
  ) {
    return this.projectsService.findByWorkspace(
      user.sub,
      params.workspaceId,
      query,
    );
  }

  @Get('projects/:projectId')
  @ApiOperation({ summary: 'Get project detail' })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  @ApiOkResponse({ type: ProjectResponseDto })
  findOne(@CurrentUser() user: JwtUser, @Param() params: ProjectIdParamDto) {
    return this.projectsService.findOne(user.sub, params.projectId);
  }

  @Patch('projects/:projectId')
  @ApiOperation({ summary: 'Update project' })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  @ApiBody({ type: UpdateProjectDto })
  @ApiOkResponse({ type: ProjectResponseDto })
  update(
    @CurrentUser() user: JwtUser,
    @Param() params: ProjectIdParamDto,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(user.sub, params.projectId, dto);
  }

  @Delete('projects/:projectId')
  @ApiOperation({ summary: 'Soft delete project' })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  @ApiOkResponse({ type: ProjectResponseDto })
  remove(@CurrentUser() user: JwtUser, @Param() params: ProjectIdParamDto) {
    return this.projectsService.remove(user.sub, params.projectId);
  }

  @Get('projects/:projectId/members')
  @ApiOperation({ summary: 'List project members' })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  @ApiOkResponse({ type: ProjectMemberResponseDto, isArray: true })
  members(@CurrentUser() user: JwtUser, @Param() params: ProjectIdParamDto) {
    return this.projectsService.members(user.sub, params.projectId);
  }

  @Post('projects/:projectId/members')
  @ApiOperation({ summary: 'Add project member' })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  @ApiBody({
    type: AddProjectMemberDto,
    examples: {
      member: {
        value: {
          user_id: '0f8fad5b-d9cb-469f-a165-70867728950e',
          role: 'Developer',
        },
      },
    },
  })
  @ApiOkResponse({ type: ProjectMemberResponseDto })
  addMember(
    @CurrentUser() user: JwtUser,
    @Param() params: ProjectIdParamDto,
    @Body() dto: AddProjectMemberDto,
  ) {
    return this.projectsService.addMember(user.sub, params.projectId, dto);
  }

  @Patch('projects/:projectId/members/:memberId')
  @ApiOperation({ summary: 'Update project member role' })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  @ApiParam({ name: 'memberId', description: 'Project member id or user id' })
  @ApiBody({ type: UpdateProjectMemberDto })
  @ApiOkResponse({ type: ProjectMemberResponseDto })
  updateMember(
    @CurrentUser() user: JwtUser,
    @Param() params: ProjectMemberParamDto,
    @Body() dto: UpdateProjectMemberDto,
  ) {
    return this.projectsService.updateMember(
      user.sub,
      params.projectId,
      params.memberId,
      dto,
    );
  }

  @Delete('projects/:projectId/members/:memberId')
  @ApiOperation({ summary: 'Remove project member' })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  @ApiParam({ name: 'memberId', description: 'Project member id or user id' })
  @ApiOkResponse({ type: ProjectMemberResponseDto })
  removeMember(
    @CurrentUser() user: JwtUser,
    @Param() params: ProjectMemberParamDto,
  ) {
    return this.projectsService.removeMember(
      user.sub,
      params.projectId,
      params.memberId,
    );
  }
}
