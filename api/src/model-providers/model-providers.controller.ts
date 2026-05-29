import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ModelProvidersService } from './model-providers.service';
import { CreateModelProviderDto } from './dto/create-model-provider.dto';
import { UpdateModelProviderDto } from './dto/update-model-provider.dto';

@Controller('model-providers')
export class ModelProvidersController {
  constructor(private readonly modelProvidersService: ModelProvidersService) {}

  @Post()
  create(@Body() dto: CreateModelProviderDto) {
    return this.modelProvidersService.create(dto);
  }

  @Get()
  findAll() {
    return this.modelProvidersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.modelProvidersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateModelProviderDto,
  ) {
    return this.modelProvidersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.modelProvidersService.remove(id);
  }
}
