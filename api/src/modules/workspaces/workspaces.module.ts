import { Module } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import PrismaService from 'src/shared/services/prisma.service';
import { ProjectsModule } from '../projects/projects.module';
import { TasksModule } from '../tasks/tasks.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { DocumentsModule } from '../documents/documents.module';
import { EmailsModule } from '../emails/emails.module';
import { ProjectEpicsModule } from '../project-epics/project-epics.module';
import { InboxItemsModule } from '../inbox-items/inbox-items.module';

@Module({
  controllers: [WorkspacesController],
  imports: [
    ProjectsModule,
    TasksModule,
    PermissionsModule,
    DocumentsModule,
    EmailsModule,
    ProjectEpicsModule,
    InboxItemsModule,
  ],
  providers: [WorkspacesService, PrismaService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
