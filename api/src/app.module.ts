import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentRolesModule } from './agent-roles/agent-roles.module';
import { AgentRunsModule } from './agent-runs/agent-runs.module';
import { BoardsModule } from './boards/boards.module';
import { DocumentsModule } from './documents/documents.module';
import { ModelProvidersModule } from './model-providers/model-providers.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectIdeasModule } from './project-ideas/project-ideas.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { WorkspacesModule } from './workspaces/workspaces.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    WorkspacesModule,
    ProjectsModule,
    BoardsModule,
    TasksModule,
    AgentRolesModule,
    AgentRunsModule,
    ProjectIdeasModule,
    ModelProvidersModule,
    DocumentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
