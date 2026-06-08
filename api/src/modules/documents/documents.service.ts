import { Injectable, NotFoundException } from '@nestjs/common';
import slugify from 'slugify';
import PrismaService from 'src/shared/services/prisma.service';
import findProjectDocumentsDto, {
  FindProjectsOrderBy,
} from './dto/find-project-documents.dto';
import { Prisma } from 'generated/prisma/client';
import CreateDocumentDto from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, projectSlug: string, dto: CreateDocumentDto) {
    const project = await this.prisma.project.findFirst({
      where: {
        slug: projectSlug,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const { title } = dto;
    const slug = await this.createUniqueSlug(project.id, title);

    const content: Prisma.InputJsonObject = {
      html: dto.content.html,
      plainText: dto.content.plainText,
    };

    const newDocument = await this.prisma.document.create({
      data: {
        project_id: project.id,
        slug,
        title,
        content,
        creator_id: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
            userInfo: {
              select: {
                full_name: true,
                avatar_url: true,
              },
            },
          },
        },
      },
    });

    return this.mapDocument(newDocument, true);
  }

  async findProjectDocuments(
    projectSlug: string,
    workspaceSlug: string,
    dto: findProjectDocumentsDto,
  ) {
    const { limit = 10, page = 1, creatorId, orderBy, title } = dto;

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (safePage - 1) * safeLimit;

    const sortDirection =
      orderBy === FindProjectsOrderBy.Oldest ? 'asc' : 'desc';

    const where = {
      project: {
        slug: projectSlug,
        workspace: {
          slug: workspaceSlug,
        },
      },
      ...(creatorId && {
        creator_id: creatorId,
      }),
      ...(title && {
        title: {
          contains: title,
          mode: Prisma.QueryMode.insensitive,
        },
      }),
    };

    const [documents, total] = await this.prisma.$transaction([
      this.prisma.document.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true,
              userInfo: {
                select: {
                  full_name: true,
                  avatar_url: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: sortDirection,
        },
        take: safeLimit,
        skip,
      }),
      this.prisma.document.count({
        where,
      }),
    ]);

    return {
      items: documents.map((d) => ({
        id: d.id,
        title: d.title,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        slug: d.slug,
        creator: {
          id: d.creator.id,
          email: d.creator.email,
          fullName: d.creator.userInfo?.full_name,
          avatarURL: d.creator.userInfo?.avatar_url,
          username: d.creator.username,
        },
      })),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
        hasNextPage: safePage * safeLimit < total,
        hasPreviousPage: safePage > 1,
      },
    };
  }

  async findProjectDocumentBySlug(
    projectSlug: string,
    workspaceSlug: string,
    documentSlug: string,
  ) {
    const document = await this.prisma.document.findFirst({
      where: {
        slug: documentSlug,
        project: {
          slug: projectSlug,
          workspace: {
            slug: workspaceSlug,
          },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
            userInfo: {
              select: {
                full_name: true,
                avatar_url: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return this.mapDocument(document, true);
  }

  private async createUniqueSlug(projectId: string, title: string) {
    const baseSlug =
      slugify(title, {
        lower: true,
        strict: true,
      }) || 'document';

    let candidate = baseSlug;
    let suffix = 2;

    while (
      await this.prisma.document.findUnique({
        where: {
          project_id_slug: {
            project_id: projectId,
            slug: candidate,
          },
        },
      })
    ) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private mapDocument<
    T extends {
      id: string;
      title: string;
      created_at: Date;
      updated_at: Date | null;
      slug: string;
      content?: Prisma.JsonValue | null;
      creator: {
        id: string;
        email: string;
        username: string;
        userInfo: {
          full_name: string | null;
          avatar_url: string | null;
        } | null;
      };
    },
  >(document: T, includeContent = false) {
    return {
      id: document.id,
      title: document.title,
      createdAt: document.created_at,
      updatedAt: document.updated_at,
      slug: document.slug,
      ...(includeContent && {
        content: document.content ?? null,
      }),
      creator: {
        id: document.creator.id,
        email: document.creator.email,
        fullName: document.creator.userInfo?.full_name,
        avatarURL: document.creator.userInfo?.avatar_url,
        username: document.creator.username,
      },
    };
  }
}
