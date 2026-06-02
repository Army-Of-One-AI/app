import { Module } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import PrismaService from 'src/shared/services/prisma.service';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  controllers: [WorkspacesController],
  imports: [ProjectsModule],
  providers: [WorkspacesService, PrismaService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
