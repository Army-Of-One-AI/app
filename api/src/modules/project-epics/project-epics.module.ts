import { Module } from '@nestjs/common';
import { ProjectEpicsService } from './project-epics.service';
import { ProjectEpicsController } from './project-epics.controller';
import PrismaService from 'src/shared/services/prisma.service';

@Module({
  controllers: [ProjectEpicsController],
  providers: [ProjectEpicsService, PrismaService],
  exports: [ProjectEpicsService],
})
export class ProjectEpicsModule {}
