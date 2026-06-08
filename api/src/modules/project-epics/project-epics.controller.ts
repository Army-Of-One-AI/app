import { Controller } from '@nestjs/common';
import { ProjectEpicsService } from './project-epics.service';

@Controller('project-epics')
export class ProjectEpicsController {
  constructor(private readonly projectEpicsService: ProjectEpicsService) {}
}
