import { Injectable } from '@nestjs/common';
import PrismaService from 'src/shared/services/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class TaskCommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, taskId: string, dto: CreateCommentDto) {
    const { replyToCommentId, content, mentionedUserIds = [] } = dto;

    const parsedContent: Prisma.InputJsonObject = {
      html: content.html,
      plainText: content.plainText,
    };

    const uniqueMentionedUserIds = [...new Set(mentionedUserIds)].filter(
      (mentionedUserId) => mentionedUserId !== userId,
    );

    const newComment = await this.prisma.taskComment.create({
      data: {
        ...(replyToCommentId && { reply_to_comment_id: replyToCommentId }),
        content: parsedContent,
        user_id: userId,
        task_id: taskId,
      },
    });

    if (uniqueMentionedUserIds.length > 0) {
      await this.prisma.inboxItem.createMany({
        data: uniqueMentionedUserIds.map((mentionedUserId) => ({
          title: 'Mentioned',
          type: 'COMMENT_MENTIONED',
          actor_id: userId,
          user_id: mentionedUserId,
          metadata: {
            taskId,
            commentId: newComment.id,
            replyToCommentId: replyToCommentId ?? null,
          },
        })),
        skipDuplicates: true,
      });
    }

    return newComment;
  }

  async getRootComments(
    taskId: string,
    query: {
      limit?: number;
      cursorCreatedAt?: string;
      cursorId?: string;
    },
  ) {
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 50);

    const comments = await this.prisma.taskComment.findMany({
      where: {
        task_id: taskId,
        reply_to_comment_id: null,
        ...(query.cursorCreatedAt &&
          query.cursorId && {
            OR: [
              {
                created_at: {
                  lt: new Date(query.cursorCreatedAt),
                },
              },
              {
                created_at: new Date(query.cursorCreatedAt),
                id: {
                  lt: query.cursorId,
                },
              },
            ],
          }),
      },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            userInfo: {
              select: {
                full_name: true,
                avatar_url: true,
              },
            },
          },
        },
        _count: {
          select: {
            replied_comments: true,
          },
        },
      },
    });

    const hasNextPage = comments.length > limit;
    const items = hasNextPage ? comments.slice(0, limit) : comments;
    const lastItem = items.at(-1);

    return {
      data: items,
      pagination: {
        hasNextPage,
        nextCursor: lastItem
          ? {
              createdAt: lastItem.created_at,
              id: lastItem.id,
            }
          : null,
      },
    };
  }

  async getReplies(
    parentCommentId: string,
    query: {
      limit?: number;
      cursorCreatedAt?: string;
      cursorId?: string;
    },
  ) {
    const limit = Math.min(Math.max(Number(query.limit ?? 10), 1), 50);

    const replies = await this.prisma.taskComment.findMany({
      where: {
        reply_to_comment_id: parentCommentId,
        ...(query.cursorCreatedAt &&
          query.cursorId && {
            OR: [
              {
                created_at: {
                  gt: new Date(query.cursorCreatedAt),
                },
              },
              {
                created_at: new Date(query.cursorCreatedAt),
                id: {
                  gt: query.cursorId,
                },
              },
            ],
          }),
      },
      orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
      take: limit + 1,
      include: {
        user: {
          select: {
            id: true,
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

    const hasNextPage = replies.length > limit;
    const items = hasNextPage ? replies.slice(0, limit) : replies;
    const lastItem = items.at(-1);

    return {
      data: items,
      pagination: {
        hasNextPage,
        nextCursor: lastItem
          ? {
              createdAt: lastItem.created_at,
              id: lastItem.id,
            }
          : null,
      },
    };
  }
}
