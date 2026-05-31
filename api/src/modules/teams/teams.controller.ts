import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TeamMemberResponseDto, TeamResponseDto } from '../common/dto/response.dto';
import type { JwtUser } from '../common/types/auth.types';
import {
  AddTeamMemberDto,
  CreateTeamDto,
  TeamIdParamDto,
  TeamMemberParamDto,
  UpdateTeamDto,
  UpdateTeamMemberDto,
  WorkspaceTeamParamDto,
} from './dto/team.dto';
import { TeamsService } from './teams.service';

@UseGuards(JwtAuthGuard)
@Controller()
@ApiTags('Teams')
@ApiBearerAuth('access-token')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post('workspaces/:workspaceId/teams')
  @ApiOperation({ summary: 'Create team in workspace' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiBody({
    type: CreateTeamDto,
    examples: {
      team: {
        value: {
          name: 'Platform Engineering',
          slug: 'platform-engineering',
          description: 'Core backend and infrastructure team',
        },
      },
    },
  })
  @ApiOkResponse({ type: TeamResponseDto })
  create(
    @CurrentUser() user: JwtUser,
    @Param() params: WorkspaceTeamParamDto,
    @Body() dto: CreateTeamDto,
  ) {
    return this.teamsService.create(user.sub, params.workspaceId, dto);
  }

  @Get('workspaces/:workspaceId/teams')
  @ApiOperation({ summary: 'List teams in workspace' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiOkResponse({ type: TeamResponseDto, isArray: true })
  findByWorkspace(
    @CurrentUser() user: JwtUser,
    @Param() params: WorkspaceTeamParamDto,
  ) {
    return this.teamsService.findByWorkspace(user.sub, params.workspaceId);
  }

  @Get('teams/:teamId')
  @ApiOperation({ summary: 'Get team detail' })
  @ApiParam({ name: 'teamId', format: 'uuid' })
  @ApiOkResponse({ type: TeamResponseDto })
  findOne(@CurrentUser() user: JwtUser, @Param() params: TeamIdParamDto) {
    return this.teamsService.findOne(user.sub, params.teamId);
  }

  @Patch('teams/:teamId')
  @ApiOperation({ summary: 'Update team' })
  @ApiParam({ name: 'teamId', format: 'uuid' })
  @ApiBody({ type: UpdateTeamDto })
  @ApiOkResponse({ type: TeamResponseDto })
  update(
    @CurrentUser() user: JwtUser,
    @Param() params: TeamIdParamDto,
    @Body() dto: UpdateTeamDto,
  ) {
    return this.teamsService.update(user.sub, params.teamId, dto);
  }

  @Delete('teams/:teamId')
  @ApiOperation({ summary: 'Soft delete team' })
  @ApiParam({ name: 'teamId', format: 'uuid' })
  @ApiOkResponse({ type: TeamResponseDto })
  remove(@CurrentUser() user: JwtUser, @Param() params: TeamIdParamDto) {
    return this.teamsService.remove(user.sub, params.teamId);
  }

  @Get('teams/:teamId/members')
  @ApiOperation({ summary: 'List team members' })
  @ApiParam({ name: 'teamId', format: 'uuid' })
  @ApiOkResponse({ type: TeamMemberResponseDto, isArray: true })
  members(@CurrentUser() user: JwtUser, @Param() params: TeamIdParamDto) {
    return this.teamsService.members(user.sub, params.teamId);
  }

  @Post('teams/:teamId/members')
  @ApiOperation({ summary: 'Add team member' })
  @ApiParam({ name: 'teamId', format: 'uuid' })
  @ApiBody({
    type: AddTeamMemberDto,
    examples: {
      member: {
        value: {
          user_id: '0f8fad5b-d9cb-469f-a165-70867728950e',
          role: 'Member',
        },
      },
    },
  })
  @ApiOkResponse({ type: TeamMemberResponseDto })
  addMember(
    @CurrentUser() user: JwtUser,
    @Param() params: TeamIdParamDto,
    @Body() dto: AddTeamMemberDto,
  ) {
    return this.teamsService.addMember(user.sub, params.teamId, dto);
  }

  @Patch('teams/:teamId/members/:memberId')
  @ApiOperation({ summary: 'Update team member role' })
  @ApiParam({ name: 'teamId', format: 'uuid' })
  @ApiParam({ name: 'memberId', description: 'Team member id or user id' })
  @ApiBody({ type: UpdateTeamMemberDto })
  @ApiOkResponse({ type: TeamMemberResponseDto })
  updateMember(
    @CurrentUser() user: JwtUser,
    @Param() params: TeamMemberParamDto,
    @Body() dto: UpdateTeamMemberDto,
  ) {
    return this.teamsService.updateMember(
      user.sub,
      params.teamId,
      params.memberId,
      dto,
    );
  }

  @Delete('teams/:teamId/members/:memberId')
  @ApiOperation({ summary: 'Remove team member' })
  @ApiParam({ name: 'teamId', format: 'uuid' })
  @ApiParam({ name: 'memberId', description: 'Team member id or user id' })
  @ApiOkResponse({ type: TeamMemberResponseDto })
  removeMember(@CurrentUser() user: JwtUser, @Param() params: TeamMemberParamDto) {
    return this.teamsService.removeMember(user.sub, params.teamId, params.memberId);
  }
}
