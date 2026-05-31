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
  WorkspaceMemberResponseDto,
  WorkspaceResponseDto,
} from '../common/dto/response.dto';
import type { JwtUser } from '../common/types/auth.types';
import {
  AddWorkspaceMemberDto,
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  UpdateWorkspaceMemberDto,
  WorkspaceIdParamDto,
  WorkspaceMemberParamDto,
  WorkspaceQueryDto,
} from './dto/workspace.dto';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
@ApiTags('Workspaces')
@ApiBearerAuth('access-token')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiOperation({ summary: 'Create workspace' })
  @ApiBody({
    type: CreateWorkspaceDto,
    examples: {
      workspace: {
        value: {
          name: 'Acme Product Team',
          slug: 'acme-product-team',
          logo_url: 'https://example.com/logo.png',
        },
      },
    },
  })
  @ApiOkResponse({ type: WorkspaceResponseDto })
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my workspaces' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false, example: 'acme' })
  @ApiOkResponse({ type: WorkspaceResponseDto, isArray: true })
  findAll(@CurrentUser() user: JwtUser, @Query() query: WorkspaceQueryDto) {
    return this.workspacesService.findAll(user.sub, query);
  }

  @Get(':workspaceId')
  @ApiOperation({ summary: 'Get workspace detail' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiOkResponse({ type: WorkspaceResponseDto })
  findOne(@CurrentUser() user: JwtUser, @Param() params: WorkspaceIdParamDto) {
    return this.workspacesService.findOne(user.sub, params.workspaceId);
  }

  @Patch(':workspaceId')
  @ApiOperation({ summary: 'Update workspace' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiBody({ type: UpdateWorkspaceDto })
  @ApiOkResponse({ type: WorkspaceResponseDto })
  update(
    @CurrentUser() user: JwtUser,
    @Param() params: WorkspaceIdParamDto,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(user.sub, params.workspaceId, dto);
  }

  @Delete(':workspaceId')
  @ApiOperation({ summary: 'Soft delete workspace' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiOkResponse({ type: WorkspaceResponseDto })
  remove(@CurrentUser() user: JwtUser, @Param() params: WorkspaceIdParamDto) {
    return this.workspacesService.remove(user.sub, params.workspaceId);
  }

  @Get(':workspaceId/members')
  @ApiOperation({ summary: 'List workspace members' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiOkResponse({ type: WorkspaceMemberResponseDto, isArray: true })
  members(@CurrentUser() user: JwtUser, @Param() params: WorkspaceIdParamDto) {
    return this.workspacesService.members(user.sub, params.workspaceId);
  }

  @Post(':workspaceId/members')
  @ApiOperation({ summary: 'Add workspace member' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiBody({
    type: AddWorkspaceMemberDto,
    examples: {
      member: {
        value: {
          user_id: '0f8fad5b-d9cb-469f-a165-70867728950e',
          role: 'Member',
        },
      },
    },
  })
  @ApiOkResponse({ type: WorkspaceMemberResponseDto })
  addMember(
    @CurrentUser() user: JwtUser,
    @Param() params: WorkspaceIdParamDto,
    @Body() dto: AddWorkspaceMemberDto,
  ) {
    return this.workspacesService.addMember(user.sub, params.workspaceId, dto);
  }

  @Patch(':workspaceId/members/:memberId')
  @ApiOperation({ summary: 'Update workspace member role' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiParam({ name: 'memberId', description: 'Workspace member id or user id' })
  @ApiBody({ type: UpdateWorkspaceMemberDto })
  @ApiOkResponse({ type: WorkspaceMemberResponseDto })
  updateMember(
    @CurrentUser() user: JwtUser,
    @Param() params: WorkspaceMemberParamDto,
    @Body() dto: UpdateWorkspaceMemberDto,
  ) {
    return this.workspacesService.updateMember(
      user.sub,
      params.workspaceId,
      params.memberId,
      dto,
    );
  }

  @Delete(':workspaceId/members/:memberId')
  @ApiOperation({ summary: 'Remove workspace member' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiParam({ name: 'memberId', description: 'Workspace member id or user id' })
  @ApiOkResponse({ type: WorkspaceMemberResponseDto })
  removeMember(
    @CurrentUser() user: JwtUser,
    @Param() params: WorkspaceMemberParamDto,
  ) {
    return this.workspacesService.removeMember(
      user.sub,
      params.workspaceId,
      params.memberId,
    );
  }
}
