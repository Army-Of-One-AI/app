import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import PrismaService from 'src/shared/services/prisma.service';

@Module({
  controllers: [ProjectsController],
  exports: [ProjectsService],
  providers: [ProjectsService, PrismaService],
})
export class ProjectsModule {}
