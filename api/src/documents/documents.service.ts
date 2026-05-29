import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateDocumentChunkDto } from './dto/create-document-chunk.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDocumentDto) {
    await this.ensureProject(dto.projectId);

    return this.prisma.document.create({
      data: {
        project_id: dto.projectId,
        title: dto.title,
        content: dto.content,
        source_type: dto.sourceType,
      },
      include: { chunks: true },
    });
  }

  findAll(projectId?: string) {
    return this.prisma.document.findMany({
      where: { project_id: projectId },
      include: { chunks: { orderBy: { index: 'asc' } } },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: { chunks: { orderBy: { index: 'asc' } } },
    });
    if (!document) throw new NotFoundException('Document not found');
    return document;
  }

  async update(id: string, dto: UpdateDocumentDto) {
    await this.findOne(id);
    await this.ensureProject(dto.projectId);

    return this.prisma.document.update({
      where: { id },
      data: {
        project_id: dto.projectId,
        title: dto.title,
        content: dto.content,
        source_type: dto.sourceType,
      },
      include: { chunks: { orderBy: { index: 'asc' } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.document.delete({ where: { id } });
  }

  async createChunk(documentId: string, dto: CreateDocumentChunkDto) {
    await this.findOne(documentId);
    return this.prisma.documentChunk.create({
      data: {
        document_id: documentId,
        content: dto.content,
        index: dto.index,
        embedding: dto.embedding,
      },
    });
  }

  async findChunks(documentId: string) {
    await this.findOne(documentId);
    return this.prisma.documentChunk.findMany({
      where: { document_id: documentId },
      orderBy: { index: 'asc' },
    });
  }

  private async ensureProject(projectId?: string) {
    if (!projectId) return;
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new BadRequestException('Project not found');
  }
}
