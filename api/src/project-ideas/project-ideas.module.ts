import { Module } from '@nestjs/common';
import { ModelProvidersModule } from '../model-providers/model-providers.module';
import { ProjectIdeasController } from './project-ideas.controller';
import { ProjectIdeasService } from './project-ideas.service';

@Module({
  imports: [ModelProvidersModule],
  controllers: [ProjectIdeasController],
  providers: [ProjectIdeasService],
})
export class ProjectIdeasModule {}
