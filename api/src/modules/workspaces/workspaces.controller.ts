import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import JWTAuthGuard from '../auth/guards/jwt-auth.guard';
import { AuthUser } from 'src/shared/types/types';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import WorkspaceRoleGuard from 'src/shared/guards/workspace-role.guard';
import { WorkspaceRole } from 'generated/prisma/client';
import UpsertWorkspaceDto from './dto/upsert-workspace.dto';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @UseGuards(JWTAuthGuard)
  @Get()
  async getCurrentUserWorkspaces(@CurrentUser() currentUser: AuthUser) {
    return await this.workspacesService.getWorkspacesByUserId(currentUser.id);
  }

  @UseGuards(JWTAuthGuard)
  @Post()
  async createWorkspace(
    @CurrentUser() currentUser: AuthUser,
    @Body() dto: UpsertWorkspaceDto,
  ) {
    return await this.workspacesService.create(currentUser.id, dto);
  }

  @UseGuards(JWTAuthGuard, WorkspaceRoleGuard([WorkspaceRole.Owner]))
  @Patch(':workspaceSlug/settings')
  async updateWorkspaceSetting(
    @Param('workspaceSlug') workspaceSlug: string,
    @Body() dto: UpsertWorkspaceDto,
  ) {
    return await this.workspacesService.updateWorkspaceSetting(
      workspaceSlug,
      dto,
    );
  }

  @UseGuards(JWTAuthGuard)
  @Get(':workspaceSlug/membership')
  async getUserMembership(
    @CurrentUser() currentUser: AuthUser,
    @Param('workspaceSlug') workspaceSlug: string,
  ) {
    const membership = await this.workspacesService.getUserWorkspaceMembership(
      currentUser.id,
      workspaceSlug,
    );
    return membership;
  }
}
