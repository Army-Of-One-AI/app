import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import PrismaService from 'src/shared/services/prisma.service';
import { ClickHouseModule } from '../click-house/click-house.module';

@Module({
  controllers: [TasksController],
  providers: [TasksService, PrismaService],
  exports: [TasksService],
  imports: [ClickHouseModule],
})
export class TasksModule {}
