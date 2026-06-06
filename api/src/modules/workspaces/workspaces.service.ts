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
import { ConfigService } from '@nestjs/config';
import InviteByEmailsDto from './dto/invite-by-emails.dto';
import { EmailsService } from '../emails/emails.service';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
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
