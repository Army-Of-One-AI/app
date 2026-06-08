import { Module } from '@nestjs/common';
import { TaskCommentsService } from './task-comments.service';
import { TaskCommentsController } from './task-comments.controller';
import PrismaService from 'src/shared/services/prisma.service';

@Module({
  controllers: [TaskCommentsController],
  providers: [TaskCommentsService, PrismaService],
  exports: [TaskCommentsService],
})
export class TaskCommentsModule {}
