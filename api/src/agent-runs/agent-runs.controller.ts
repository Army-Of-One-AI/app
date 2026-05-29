import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { AgentRunsService } from './agent-runs.service';
import { CreateAgentRunDto } from './dto/create-agent-run.dto';

@Controller('agent-runs')
export class AgentRunsController {
  constructor(private readonly agentRunsService: AgentRunsService) {}

  @Post()
  create(@Body() dto: CreateAgentRunDto) {
    return this.agentRunsService.create(dto);
  }

  @Get()
  findAll(
    @Query('taskId') taskId?: string,
    @Query('agentId') agentId?: string,
  ) {
    return this.agentRunsService.findAll(taskId, agentId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.agentRunsService.findOne(id);
  }
}
