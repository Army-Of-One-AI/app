import { Module } from '@nestjs/common';
import { TaskLabelsService } from './task-labels.service';
import { TaskLabelsController } from './task-labels.controller';
import PrismaService from 'src/shared/services/prisma.service';

@Module({
  controllers: [TaskLabelsController],
  providers: [TaskLabelsService, PrismaService],
  exports: [TaskLabelsService],
})
export class TaskLabelsModule {}
