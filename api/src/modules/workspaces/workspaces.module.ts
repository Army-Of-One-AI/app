import { Module } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import PrismaService from 'src/shared/services/prisma.service';
import { ProjectsModule } from '../projects/projects.module';
import { TasksModule } from '../tasks/tasks.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { DocumentsModule } from '../documents/documents.module';
import { EmailsModule } from '../emails/emails.module';

@Module({
  controllers: [WorkspacesController],
  imports: [
    ProjectsModule,
    TasksModule,
    PermissionsModule,
    DocumentsModule,
    EmailsModule,
  ],
  providers: [WorkspacesService, PrismaService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
