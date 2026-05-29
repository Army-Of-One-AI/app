import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ExpandProjectIdeaDto } from './dto/expand-project-idea.dto';
import { GenerateProjectPlanDto } from './dto/generate-project-plan.dto';
import { StartGeneratePlanJobDto } from './dto/start-generate-plan-job.dto';
import { ProjectIdeasService } from './project-ideas.service';

@Controller('project-ideas')
export class ProjectIdeasController {
  constructor(private readonly projectIdeasService: ProjectIdeasService) {}

  @Post('expand')
  expand(@Body() dto: ExpandProjectIdeaDto) {
    return this.projectIdeasService.expand(dto);
  }

  @Post('generate-plan')
  generatePlan(@Body() dto: GenerateProjectPlanDto) {
    return this.projectIdeasService.generatePlan(dto);
  }

  @Post('generate-plan/jobs')
  startGeneratePlanJob(@Body() dto: StartGeneratePlanJobDto) {
    return this.projectIdeasService.startGeneratePlanJob(dto);
  }

  @Get('generate-plan/jobs/:jobId')
  getGeneratePlanJob(@Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.projectIdeasService.getGeneratePlanJob(jobId);
  }

  @Post('generate-plan/jobs/:jobId/cancel')
  cancelGeneratePlanJob(@Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.projectIdeasService.cancelGeneratePlanJob(jobId);
  }
}
