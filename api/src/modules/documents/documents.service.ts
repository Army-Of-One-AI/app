import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProjectRole } from '../../../generated/prisma/client.cjs';
import { AccessService } from '../common/services/access.service';
import { getPagination, paginated } from '../common/utils/pagination';
import { toSlug } from '../common/utils/slug';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDocumentDto,
  DocumentQueryDto,
  UpdateDocumentDto,
  UpdateDocumentStatusDto,
} from './dto/document.dto';

const DOCUMENT_MANAGERS = [
  ProjectRole.Owner,
  ProjectRole.ProductOwner,
  ProjectRole.ProjectManager,
  ProjectRole.TechLead,
];

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async create(userId: string, projectId: string, dto: CreateDocumentDto) {
    await this.access.assertProjectRole(userId, projectId, DOCUMENT_MANAGERS);

    try {
      return await this.prisma.document.create({
        data: {
          project_id: projectId,
          creator_id: userId,
          title: dto.title,
          slug: toSlug(dto.slug ?? dto.title),
          content: dto.content ?? undefined,
          status: dto.status,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findByProject(
    userId: string,
    projectId: string,
    query: DocumentQueryDto,
  ) {
    await this.access.assertProjectMember(userId, projectId);
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.DocumentWhereInput = {
      project_id: projectId,
      deleted_at: null,
      status: query.status,
      ...(query.search
        ? { title: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.document.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.document.count({ where }),
    ]);

    return paginated(data, total, page, limit);
  }

  async findOne(userId: string, documentId: string) {
    const document = await this.getActiveDocument(documentId);
    await this.access.assertProjectMember(userId, document.project_id);
    return document;
  }

  async update(userId: string, documentId: string, dto: UpdateDocumentDto) {
    const document = await this.getActiveDocument(documentId);
    await this.access.assertProjectRole(userId, document.project_id, DOCUMENT_MANAGERS);

    return this.prisma.document.update({
      where: { id: documentId },
      data: dto,
    });
  }

  async remove(userId: string, documentId: string) {
    const document = await this.getActiveDocument(documentId);
    await this.access.assertProjectRole(userId, document.project_id, DOCUMENT_MANAGERS);

    return this.prisma.document.update({
      where: { id: documentId },
      data: { deleted_at: new Date() },
    });
  }

  async updateStatus(
    userId: string,
    documentId: string,
    dto: UpdateDocumentStatusDto,
  ) {
    const document = await this.getActiveDocument(documentId);
    await this.access.assertProjectRole(userId, document.project_id, DOCUMENT_MANAGERS);

    return this.prisma.document.update({
      where: { id: documentId },
      data: { status: dto.status },
    });
  }

  private async getActiveDocument(documentId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, deleted_at: null },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('Document value already exists');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Document not found');
      }
    }

    throw new BadRequestException('Document operation failed');
  }
}
