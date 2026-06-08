import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import PrismaService from 'src/shared/services/prisma.service';
import { ClickHouseModule } from '../click-house/click-house.module';

@Module({
  controllers: [ProjectsController],
  exports: [ProjectsService],
  imports: [ClickHouseModule],
  providers: [ProjectsService, PrismaService],
})
export class ProjectsModule {}
