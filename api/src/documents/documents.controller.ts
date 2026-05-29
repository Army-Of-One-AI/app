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
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateDocumentChunkDto } from './dto/create-document-chunk.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  create(@Body() dto: CreateDocumentDto) {
    return this.documentsService.create(dto);
  }

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    return this.documentsService.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.remove(id);
  }

  @Post(':id/chunks')
  createChunk(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDocumentChunkDto,
  ) {
    return this.documentsService.createChunk(id, dto);
  }

  @Get(':id/chunks')
  findChunks(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.findChunks(id);
  }
}
