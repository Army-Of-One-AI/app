import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { DocumentStatus } from '../../../generated/prisma/client.cjs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DocumentResponseDto } from '../common/dto/response.dto';
import type { JwtUser } from '../common/types/auth.types';
import {
  CreateDocumentDto,
  DocumentIdParamDto,
  DocumentQueryDto,
  ProjectDocumentParamDto,
  UpdateDocumentDto,
  UpdateDocumentStatusDto,
} from './dto/document.dto';
import { DocumentsService } from './documents.service';

@UseGuards(JwtAuthGuard)
@Controller()
@ApiTags('Documents')
@ApiBearerAuth('access-token')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('projects/:projectId/documents')
  @ApiOperation({ summary: 'Create document in project' })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  @ApiBody({
    type: CreateDocumentDto,
    examples: {
      document: {
        value: {
          title: 'Project Brief',
          slug: 'project-brief',
          content: { markdown: '# Project Brief\nGoals and scope...' },
          status: 'Draft',
        },
      },
    },
  })
  @ApiOkResponse({ type: DocumentResponseDto })
  create(
    @CurrentUser() user: JwtUser,
    @Param() params: ProjectDocumentParamDto,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.documentsService.create(user.sub, params.projectId, dto);
  }

  @Get('projects/:projectId/documents')
  @ApiOperation({ summary: 'List documents by project' })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  @ApiQuery({ name: 'status', enum: DocumentStatus, required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false, example: 'brief' })
  @ApiOkResponse({ type: DocumentResponseDto, isArray: true })
  findByProject(
    @CurrentUser() user: JwtUser,
    @Param() params: ProjectDocumentParamDto,
    @Query() query: DocumentQueryDto,
  ) {
    return this.documentsService.findByProject(user.sub, params.projectId, query);
  }

  @Get('documents/:documentId')
  @ApiOperation({ summary: 'Get document detail' })
  @ApiParam({ name: 'documentId', format: 'uuid' })
  @ApiOkResponse({ type: DocumentResponseDto })
  findOne(@CurrentUser() user: JwtUser, @Param() params: DocumentIdParamDto) {
    return this.documentsService.findOne(user.sub, params.documentId);
  }

  @Patch('documents/:documentId')
  @ApiOperation({ summary: 'Update document' })
  @ApiParam({ name: 'documentId', format: 'uuid' })
  @ApiBody({ type: UpdateDocumentDto })
  @ApiOkResponse({ type: DocumentResponseDto })
  update(
    @CurrentUser() user: JwtUser,
    @Param() params: DocumentIdParamDto,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(user.sub, params.documentId, dto);
  }

  @Delete('documents/:documentId')
  @ApiOperation({ summary: 'Soft delete document' })
  @ApiParam({ name: 'documentId', format: 'uuid' })
  @ApiOkResponse({ type: DocumentResponseDto })
  remove(@CurrentUser() user: JwtUser, @Param() params: DocumentIdParamDto) {
    return this.documentsService.remove(user.sub, params.documentId);
  }

  @Patch('documents/:documentId/status')
  @ApiOperation({ summary: 'Update document status' })
  @ApiParam({ name: 'documentId', format: 'uuid' })
  @ApiBody({ type: UpdateDocumentStatusDto })
  @ApiOkResponse({ type: DocumentResponseDto })
  updateStatus(
    @CurrentUser() user: JwtUser,
    @Param() params: DocumentIdParamDto,
    @Body() dto: UpdateDocumentStatusDto,
  ) {
    return this.documentsService.updateStatus(user.sub, params.documentId, dto);
  }
}
