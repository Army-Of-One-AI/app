import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import JWTAuthGuard from '../auth/guards/jwt-auth.guard';
import { AuthUser } from 'src/shared/types/types';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import WorkspaceRoleGuard from 'src/shared/guards/workspace-role.guard';
import { WorkspaceRole } from 'generated/prisma/client';
import UpsertWorkspaceDto from './dto/upsert-workspace.dto';
import FindProjectsDto from '../projects/dto/find-projects.dto';
import { ProjectsService } from '../projects/projects.service';
import { CreateProjectDto } from '../projects/dto/create-project.dto';
import { ProjectRoleGuard } from 'src/shared/guards/project-role.guard';
import { TasksService } from '../tasks/tasks.service';
import { CreateTaskDto } from '../tasks/dto/create-task.dto';
import { CurrentUserProjectPermissionsInterceptor } from 'src/shared/interceptors/current-user-project-permissions.interceptor';
import {
  PROJECT_CREATE_ROLES,
  PROJECT_READ_ROLES,
  TASK_CREATE_ROLES,
  TASK_READ_ROLES,
  TASK_UPDATE_ROLES,
} from '../permissions/permissions.service';
import { UpdateTaskDto } from '../tasks/dto/update-task.dto';
@Controller('workspaces')
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService,
  ) {}

  @UseGuards(JWTAuthGuard)
  @Get()
  async getCurrentUserWorkspaces(@CurrentUser() currentUser: AuthUser) {
    return await this.workspacesService.getWorkspacesByUserId(currentUser.id);
  }

  @UseGuards(
    JWTAuthGuard,
    WorkspaceRoleGuard([
      WorkspaceRole.Owner,
      WorkspaceRole.Owner,
      WorkspaceRole.Member,
    ]),
  )
  @Get(':workspaceSlug')
  async getWorkspaceDetails(
    @CurrentUser() user: { id: string },
    @Param('workspaceSlug') slug: string,
  ) {
    return await this.workspacesService.getWorkspaceDetailsBySlug(
      slug,
      user.id,
    );
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

  @UseGuards(
    JWTAuthGuard,
    WorkspaceRoleGuard([
      WorkspaceRole.Owner,
      WorkspaceRole.Owner,
      WorkspaceRole.Member,
    ]),
  )
  @Get(':workspaceSlug/projects')
  async findWorkspaceProjects(
    @Param('workspaceSlug') slug: string,
    @Query() query: FindProjectsDto,
  ) {
    return await this.projectsService.findProjects(query, slug);
  }

  @UseGuards(JWTAuthGuard, ProjectRoleGuard(PROJECT_CREATE_ROLES))
  @Post(':workspaceSlug/projects')
  async createWorkspaceProject(
    @CurrentUser() user: AuthUser,
    @Param('workspaceSlug') slug: string,
    @Body() payload: CreateProjectDto,
  ) {
    return await this.projectsService.create(user.id, slug, payload);
  }

  @UseGuards(JWTAuthGuard, ProjectRoleGuard(PROJECT_READ_ROLES))
  @UseInterceptors(CurrentUserProjectPermissionsInterceptor)
  @Get(':workspaceSlug/projects/:projectSlug')
  async getProjectDetails(
    @Param('workspaceSlug') wsSlug: string,
    @Param('projectSlug') pjSlug: string,
  ) {
    return await this.projectsService.getProjectBySlug(pjSlug, wsSlug);
  }

  @UseGuards(JWTAuthGuard, ProjectRoleGuard(TASK_READ_ROLES))
  @UseInterceptors(CurrentUserProjectPermissionsInterceptor)
  @Get(':workspaceSlug/projects/:projectSlug/tasks')
  async getTasksByProjectSlug(
    @Param('workspaceSlug') wsSlug: string,
    @Param('projectSlug') pjSlug: string,
  ) {
    const tasks = await this.tasksService.getTasksByProjectSlug(pjSlug, wsSlug);
    return { tasks };
  }

  @UseGuards(JWTAuthGuard, ProjectRoleGuard(TASK_READ_ROLES))
  @Get(':workspaceSlug/projects/:projectSlug/tasks/:taskId')
  async getTaskById(
    @Param('projectSlug') pjSlug: string,
    @Param('taskId') taskId: string,
  ) {
    return await this.tasksService.getTaskById(taskId, pjSlug);
  }

  @UseGuards(JWTAuthGuard, ProjectRoleGuard(TASK_CREATE_ROLES))
  @Post(':workspaceSlug/projects/:projectSlug/tasks')
  async createProjectTask(
    @CurrentUser() user: { id: string },
    @Param('workspaceSlug') wsSlug: string,
    @Param('projectSlug') pjSlug: string,
    @Body() payload: CreateTaskDto,
  ) {
    return await this.tasksService.createNewTask(
      user.id,
      wsSlug,
      pjSlug,
      payload,
    );
  }

  @UseGuards(JWTAuthGuard, ProjectRoleGuard(TASK_UPDATE_ROLES))
  @Patch(':workspaceSlug/projects/:projectSlug/tasks/:taskId')
  async updateTask(
    @Param('workspaceSlug') wsSlug: string,
    @Param('projectSlug') pjSlug: string,
    @Param('taskId') taskId: string,
    @Body() payload: UpdateTaskDto,
  ) {
    return await this.tasksService.updateTask(wsSlug, pjSlug, taskId, payload);
  }

  @UseGuards(JWTAuthGuard, ProjectRoleGuard(PROJECT_READ_ROLES))
  @Get(':workspaceSlug/projects/:projectSlug/members')
  async getProjectMembers(
    @Param('workspaceSlug') wsSlug: string,
    @Param('projectSlug') pjSlug: string,
  ) {
    return await this.projectsService.getProjectMembers(pjSlug, wsSlug);
  }
}
