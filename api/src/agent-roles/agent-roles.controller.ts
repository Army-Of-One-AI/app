import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AgentRolesService } from './agent-roles.service';
import { CreateAgentRoleDto } from './dto/create-agent-role.dto';
import { UpdateAgentRoleDto } from './dto/update-agent-role.dto';

@Controller('agent-roles')
export class AgentRolesController {
  constructor(private readonly agentRolesService: AgentRolesService) {}

  @Post()
  create(@Body() dto: CreateAgentRoleDto) {
    return this.agentRolesService.create(dto);
  }

  @Get()
  findAll(@Query('workspaceId') workspaceId?: string) {
    return this.agentRolesService.findAll(workspaceId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.agentRolesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAgentRoleDto,
  ) {
    return this.agentRolesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.agentRolesService.remove(id);
  }
}
