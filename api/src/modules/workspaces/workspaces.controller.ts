import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
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
  PROJECT_MEMBER_MANAGE_ROLES,
  PROJECT_READ_ROLES,
  TASK_ARCHIVE_ROLES,
  TASK_CREATE_ROLES,
  TASK_DELETE_ROLES,
  TASK_READ_ROLES,
  TASK_UPDATE_ROLES,
} from '../permissions/permissions.service';
import { UpdateTaskDto } from '../tasks/dto/update-task.dto';
import { DocumentsService } from '../documents/documents.service';
import findProjectDocumentsDto from '../documents/dto/find-project-documents.dto';
import CreateDocumentDto from '../documents/dto/create-document.dto';
import GetTaskActivitiesDto from './dto/get-task-activities.dto';
import InviteByEmailsDto from './dto/invite-by-emails.dto';
import AddMemberToProject from './dto/add-member-to-project';

@Controller('workspaces')
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService,
    private readonly documentsService: DocumentsService,
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
      WorkspaceRole.Admin,
      WorkspaceRole.Owner,
    ]),
  )
  @Get(':workspaceSlug/members')
  async getWorkspaceMembers(@Param('workspaceSlug') workspaceSlug: string) {
    return await this.workspacesService.getWorkspaceMembers(workspaceSlug);
  }

  @UseGuards(
    JWTAuthGuard,
    WorkspaceRoleGuard([WorkspaceRole.Owner, WorkspaceRole.Admin]),
  )
  @Post(':workspaceSlug/invites')
  async inviteByEmails(
    @CurrentUser() user: { id: string },
    @Param('workspaceSlug') workspaceSlug: string,
    @Body() payload: InviteByEmailsDto,
  ) {
    return await this.workspacesService.inviteByEmails(
      user.id,
      workspaceSlug,
      payload,
    );
  }

  @UseGuards(
    JWTAuthGuard,
    WorkspaceRoleGuard([WorkspaceRole.Owner, WorkspaceRole.Admin]),
  )
  @Get(':workspaceSlug/invites')
  async getWorkspaceInvites(@Param('workspaceSlug') workspaceSlug: string) {
    return await this.workspacesService.getWorkspaceInvites(workspaceSlug);
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

  @UseGuards(JWTAuthGuard, ProjectRoleGuard(PROJECT_READ_ROLES))
  @UseInterceptors(CurrentUserProjectPermissionsInterceptor)
  @Get(':workspaceSlug/projects/:projectSlug/summary')
  async getProjectSummary(
    @Param('workspaceSlug') wsSlug: string,
    @Param('projectSlug') pjSlug: string,
  ) {
    return await this.projectsService.getProjectSummary(pjSlug, wsSlug);
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
    @CurrentUser() user: { id: string },
    @Param('workspaceSlug') wsSlug: string,
    @Param('projectSlug') pjSlug: string,
    @Param('taskId') taskId: string,
    @Body() payload: UpdateTaskDto,
  ) {
    return await this.tasksService.updateTask(
      user.id,
      wsSlug,
      pjSlug,
      taskId,
      payload,
    );
  }

  @UseGuards(JWTAuthGuard, ProjectRoleGuard(TASK_DELETE_ROLES))
  @Delete(':workspaceSlug/projects/:projectSlug/tasks/:taskId')
  async deleteTask(
    @Param('projectSlug') pjSlug: string,
    @Param('taskId') taskId: string,
  ) {
    return await this.tasksService.deleteTask(taskId, pjSlug);
  }

  @UseGuards(JWTAuthGuard, ProjectRoleGuard(TASK_ARCHIVE_ROLES))
  @Put(':workspaceSlug/projects/:projectSlug/tasks/:taskId/archive')
  async archiveTask(
    @Param('projectSlug') pjSlug: string,
    @Param('taskId') taskId: string,
  ) {
    return await this.tasksService.archiveTask(taskId, pjSlug);
  }

  @UseGuards(JWTAuthGuard, ProjectRoleGuard(TASK_ARCHIVE_ROLES))
  @Put(':workspaceSlug/projects/:projectSlug/tasks/:taskId/unarchive')
  async unarchiveTask(
    @Param('projectSlug') pjSlug: string,
    @Param('taskId') taskId: string,
  ) {
    return await this.tasksService.unarchiveTask(taskId, pjSlug);
  }

  @UseGuards(JWTAuthGuard, ProjectRoleGuard(TASK_READ_ROLES))
  @Get(':workspaceSlug/projects/:projectSlug/tasks/:taskId/activities')
  async getTaskActivities(
    @Param('projectSlug') pjSlug: string,
    @Param('taskId') taskId: string,
    @Query() query: GetTaskActivitiesDto,
  ) {
    return await this.tasksService.getTaskActivities(taskId, pjSlug, query);
  }

  @UseGuards(JWTAuthGuard, ProjectRoleGuard(PROJECT_READ_ROLES))
  @Get(':workspaceSlug/projects/:projectSlug/members')
  async getProjectMembers(
    @Param('workspaceSlug') wsSlug: string,
    @Param('projectSlug') pjSlug: string,
  ) {
    return await this.projectsService.getProjectMembers(pjSlug, wsSlug);
  }

  @UseGuards(JWTAuthGuard, ProjectRoleGuard(PROJECT_MEMBER_MANAGE_ROLES))
  @Post(':workspaceSlug/projects/:projectSlug/members')
  async addMemberToProject(
    @Param('projectSlug') pjSlug: string,
    @Param('workspaceSlug') wsSlug: string,
    @Body() payload: AddMemberToProject,
  ) {
    return await this.projectsService.addMemberToProject(
      pjSlug,
      wsSlug,
      payload,
    );
  }

  @UseGuards(JWTAuthGuard, ProjectRoleGuard(PROJECT_MEMBER_MANAGE_ROLES))
  @Delete(':workspaceSlug/projects/:projectSlug/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMemberFromProject(
    @Param('projectSlug') projectSlug: string,
    @Param('workspaceSlug') workspaceSlug: string,
    @Param('memberId') memberId: string,
  ) {
    await this.projectsService.removeMemberFromProject(
      projectSlug,
      workspaceSlug,
      memberId,
    );
  }

  @UseGuards(JWTAuthGuard, ProjectRoleGuard(PROJECT_READ_ROLES))
  @Get(':workspaceSlug/projects/:projectSlug/documents')
  async findProjectDocuments(
    @Param('workspaceSlug') wsSlug: string,
    @Param('projectSlug') pjSlug: string,
    @Query() query: findProjectDocumentsDto,
  ) {
    return await this.documentsService.findProjectDocuments(
      pjSlug,
      wsSlug,
      query,
    );
  }

  @UseGuards(JWTAuthGuard, ProjectRoleGuard(PROJECT_CREATE_ROLES))
  @Post(':workspaceSlug/projects/:projectSlug/documents')
  async createProjectDocuments(
    @CurrentUser() user: { id: string },
    @Param('projectSlug') pjSlug: string,
    @Body() payload: CreateDocumentDto,
  ) {
    return await this.documentsService.create(user.id, pjSlug, payload);
  }
}
