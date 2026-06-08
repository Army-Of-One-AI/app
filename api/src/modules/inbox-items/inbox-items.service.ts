import { Injectable } from '@nestjs/common';
import PrismaService from 'src/shared/services/prisma.service';

@Injectable()
export class InboxItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserInboxItems(userId: string) {
    const inboxItems = await this.prisma.inboxItem.findMany({
      where: {
        user_id: userId,
      },
      include: {
        actor: {
          include: {
            userInfo: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return inboxItems.map((item) => ({
      id: item.id,

      userId: item.user_id,
      actorId: item.actor_id,

      workspaceId: item.workspace_id,
      projectId: item.project_id,
      taskId: item.task_id,
      inviteId: item.invite_id,

      type: item.type,

      title: item.title,
      message: item.message,
      metadata: item.metadata,

      readAt: item.read_at,
      archivedAt: item.archived_at,

      actor: item.actor
        ? {
            id: item.actor.id,
            username: item.actor.username,
            fullName: item.actor.userInfo?.full_name,
            avatarURL: item.actor.userInfo?.avatar_url,
          }
        : null,

      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  }
}
