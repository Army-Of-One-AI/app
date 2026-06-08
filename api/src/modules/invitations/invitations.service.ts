import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import PrismaService from 'src/shared/services/prisma.service';

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentUserInvitations(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        email: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const invites = await this.prisma.workspaceInvite.findMany({
      where: {
        email: user.email,
        accepted_at: null,
        revoked_at: null,
        expires_at: {
          gte: new Date(),
        },
      },
      include: {
        creator: {
          include: {
            userInfo: true,
          },
        },
        workspace: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return invites.map((invite) => ({
      id: invite.id,
      createdAt: invite.created_at,
      email: invite.email,
      acceptedAt: invite.accepted_at,
      expiresAt: invite.expires_at,
      revokedAt: invite.revoked_at,
      creator: {
        id: invite.creator.id,
        email: invite.creator.email,
        fullName: invite.creator.userInfo?.full_name,
        avatarURL: invite.creator.userInfo?.avatar_url,
      },
      workspace: {
        id: invite.workspace.id,
        logoURL: invite.workspace.logo_url,
        name: invite.workspace.name,
        slug: invite.workspace.slug,
      },
    }));
  }

  async getInvitationDetails(userId: string, id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const invite = await this.prisma.workspaceInvite.findFirst({
      where: {
        id,
        email: user.email,
      },
      include: {
        creator: {
          include: {
            userInfo: true,
          },
        },
        workspace: true,
      },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    return {
      id: invite.id,
      createdAt: invite.created_at,
      email: invite.email,
      acceptedAt: invite.accepted_at,
      expiresAt: invite.expires_at,
      revokedAt: invite.revoked_at,
      creator: {
        id: invite.creator.id,
        email: invite.creator.email,
        fullName: invite.creator.userInfo?.full_name,
        avatarURL: invite.creator.userInfo?.avatar_url,
      },
      workspace: {
        id: invite.workspace.id,
        logoURL: invite.workspace.logo_url,
        name: invite.workspace.name,
        slug: invite.workspace.slug,
      },
    };
  }

  async acceptInvite(userId: string, inviteId: string) {
    const invite = await this.prisma.workspaceInvite.findUnique({
      where: {
        id: inviteId,
      },
      include: {
        workspace: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
      },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.revoked_at) {
      throw new BadRequestException('Invite has been revoked');
    }

    if (invite.accepted_at) {
      throw new BadRequestException('Invite has already been accepted');
    }

    if (invite.expires_at < new Date()) {
      throw new BadRequestException('Invite has expired');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new ForbiddenException(
        'This invite was sent to a different email address',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const member = await tx.workspaceMember.upsert({
        where: {
          workspace_id_member_id: {
            workspace_id: invite.workspace_id,
            member_id: userId,
          },
        },
        create: {
          workspace_id: invite.workspace_id,
          member_id: userId,
          role: 'Member',
        },
        update: {},
      });

      const acceptedInvite = await tx.workspaceInvite.update({
        where: {
          id: invite.id,
        },
        data: {
          accepted_at: new Date(),
        },
      });

      return {
        workspace: invite.workspace,
        member,
        invite: acceptedInvite,
      };
    });

    return result;
  }
}
