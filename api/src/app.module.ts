import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { EmailsModule } from './modules/emails/emails.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { ClickHouseModule } from './modules/click-house/click-house.module';
import { ProjectEpicsModule } from './modules/project-epics/project-epics.module';
import { InboxItemsModule } from './modules/inbox-items/inbox-items.module';
import { SprintsModule } from './modules/sprints/sprints.module';
import { TaskCommentsModule } from './modules/task-comments/task-comments.module';
import { TaskLabelsModule } from './modules/task-labels/task-labels.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') ?? 'localhost',
          port: configService.get<number>('REDIS_PORT') ?? 6379,
        },
      }),
    }),
    AuthModule,
    UsersModule,
    WorkspacesModule,
    ProjectsModule,
    TasksModule,
    PermissionsModule,
    EmailsModule,
    InvitationsModule,
    ClickHouseModule,
    ProjectEpicsModule,
    InboxItemsModule,
    SprintsModule,
    TaskCommentsModule,
    TaskLabelsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
