import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import PrismaService from 'src/shared/services/prisma.service';
import { WorkspaceRole } from 'generated/prisma/enums';
import UpsertWorkspaceDto from './dto/upsert-workspace.dto';
import { Prisma } from 'generated/prisma/client';
import { getUniqueFields } from 'src/shared/helpers/prisma.helper';
import InviteByEmailsDto from './dto/invite-by-emails.dto';
import { EmailsService } from '../emails/emails.service';
import updateMemberRoleDto from './dto/update-member-role';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailsService: EmailsService,
  ) {}

  async create(userId: string, dto: UpsertWorkspaceDto) {
    try {
      const workspace = await this.prisma.workspace.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          ...(dto.logoURL && { logo_url: dto.logoURL }),
          members: {
            create: {
              member_id: userId,
              role: WorkspaceRole.Owner,
            },
          },
        },
      });

      return {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        logoURL: workspace.logo_url,
        createdAt: workspace.created_at,
        updatedAt: workspace.updated_at,
      };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const fields = getUniqueFields(err);

        throw new BadRequestException({
          message: 'Validation failed',
          errors: Object.fromEntries(
            fields.map((field) => [
              field,
              `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
            ]),
          ),
        });
      }

      throw err;
    }
  }

  async getWorkspaceDetailsBySlug(slug: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: {
        slug,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        last_used_workspace_id: workspace.id,
      },
    });

    return {
      id: workspace.id,
      createdAt: workspace.created_at,
      updatedAt: workspace.updated_at,
      name: workspace.name,
      slug: workspace.slug,
      logoURL: workspace.logo_url,
    };
  }

  async updateWorkspaceSetting(workspaceSlug: string, dto: UpsertWorkspaceDto) {
    const { name, slug, logoURL } = dto;

    const workspace = await this.prisma.workspace.update({
      where: {
        slug: workspaceSlug,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(logoURL !== undefined && { logo_url: logoURL }),
        ...(slug !== undefined && { slug }),
      },
    });

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      logoURL: workspace.logo_url,
      createdAt: workspace.created_at,
      updatedAt: workspace.updated_at,
    };
  }

  async getWorkspacesByUserId(userId: string) {
    const workspaces = await this.prisma.workspaceMember.findMany({
      where: { member_id: userId },
      select: {
        workspace: true,
        role: true,
      },
      orderBy: {
        workspace: {
          created_at: 'desc',
        },
      },
    });

    return workspaces.map((wm) => ({
      id: wm.workspace.id,
      name: wm.workspace.name,
      slug: wm.workspace.slug,
      role: wm.role,
    }));
  }

  async getUserWorkspaceMembership(userId: string, workspaceSlug: string) {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: {
        member_id: userId,
        workspace: {
          slug: workspaceSlug,
        },
      },
    });

    return membership;
  }

  async findWorkspaceProjects(workspaceSlug: string) {
    const projects = await this.prisma.project.findMany({
      where: {
        deleted_at: null,
        workspace: {
          slug: workspaceSlug,
        },
      },
    });

    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      status: String(p.status),
      targetDate: String(p.target_date),
      startDate: String(p.start_date),
      description: p.description,
    }));
  }

  async inviteByEmails(
    userId: string,
    workspaceSlug: string,
    dto: InviteByEmailsDto,
  ) {
    const { emails } = dto;

    const workspace = await this.prisma.workspace.findUnique({
      where: {
        slug: workspaceSlug,
      },
      select: {
        id: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const normalizedEmails = [
      ...new Set(
        emails.map((email) => email.trim().toLowerCase()).filter(Boolean),
      ),
    ];

    if (normalizedEmails.length === 0) {
      throw new BadRequestException('At least one valid email is required');
    }

    const workspaceId = workspace.id;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const acceptedInvites = await this.prisma.workspaceInvite.findMany({
      where: {
        workspace_id: workspaceId,
        email: {
          in: normalizedEmails,
        },
        accepted_at: {
          not: null,
        },
      },
      select: {
        email: true,
      },
    });

    const acceptedEmailSet = new Set(
      acceptedInvites.map((invite) => invite.email),
    );

    const emailsToInvite = normalizedEmails.filter(
      (email) => !acceptedEmailSet.has(email),
    );

    const skipped = normalizedEmails
      .filter((email) => acceptedEmailSet.has(email))
      .map((email) => ({
        email,
        reason: 'already_accepted' as const,
      }));

    const invites =
      emailsToInvite.length > 0
        ? await this.prisma.$transaction(
            emailsToInvite.map((email) =>
              this.prisma.workspaceInvite.upsert({
                where: {
                  workspace_id_email: {
                    workspace_id: workspaceId,
                    email,
                  },
                },
                create: {
                  created_by: userId,
                  workspace_id: workspaceId,
                  email,
                  expires_at: expiresAt,
                },
                update: {
                  expires_at: expiresAt,
                  revoked_at: null,
                },
              }),
            ),
          )
        : [];

    if (invites.length > 0) {
      void this.emailsService.enqueueWorkspaceInvitationEmailQueue(invites);
    }

    return {
      invited: invites,
      skipped,
    };
  }

  async getWorkspaceMembers(workspaceSlug: string) {
    const members = await this.prisma.workspaceMember.findMany({
      where: {
        workspace: {
          slug: workspaceSlug,
        },
      },
      select: {
        role: true,
        created_at: true,
        member: {
          select: {
            id: true,
            email: true,
            username: true,
            userInfo: {
              select: {
                full_name: true,
                avatar_url: true,
                title: true,
                phone_no: true,
              },
            },
            _count: {
              select: {
                teams: true,
              },
            },
          },
        },
      },
    });

    return members.map((m) => {
      const { email, id, username, userInfo } = m.member;
      return {
        joinedAt: m.created_at,
        role: m.role,
        id,
        email,
        username,
        teamsCount: m.member._count.teams,
        fullName: userInfo?.full_name || '',
        title: userInfo?.title || '',
        phoneNo: userInfo?.title || '',
        avatarURL: userInfo?.avatar_url || '',
      };
    });
  }

  async getWorkspaceInvites(workspaceSlug: string) {
    const invites = await this.prisma.workspaceInvite.findMany({
      where: {
        workspace: {
          slug: workspaceSlug,
        },
      },
      select: {
        id: true,
        created_at: true,
        email: true,
        accepted_at: true,
        expires_at: true,
        revoked_at: true,
        creator: {
          include: {
            userInfo: true,
          },
        },
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
    }));
  }

  async updateMemberRole(
    workspaceSlug: string,
    memberId: string,
    dto: updateMemberRoleDto,
  ) {
    const { role } = dto;

    const workspace = await this.prisma.workspace.findUnique({
      where: {
        slug: workspaceSlug,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const currentMemberRole = await this.prisma.workspaceMember.findUnique({
      where: {
        workspace_id_member_id: {
          member_id: memberId,
          workspace_id: workspace.id,
        },
      },
    });

    if (currentMemberRole?.role === 'Owner') {
      throw new ForbiddenException('Cannot update role of owner');
    }

    return this.prisma.workspaceMember.update({
      where: {
        workspace_id_member_id: {
          member_id: memberId,
          workspace_id: workspace.id,
        },
      },
      data: {
        role,
      },
    });
  }
}
