import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import PrismaService from 'src/shared/services/prisma.service';
import { WorkspaceRole } from 'generated/prisma/enums';
import UpsertWorkspaceDto from './dto/upsert-workspace.dto';
import { Prisma } from 'generated/prisma/client';
import { getUniqueFields } from 'src/shared/helpers/prisma.helper';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';
import InviteByEmailsDto from './dto/invite-by-emails.dto';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
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
    const apiKey = this.configService.getOrThrow<string>('RESEND_API_KEY');
    const appUrl = this.configService.getOrThrow<string>('APP_URL');
    const resend = new Resend(apiKey);

    const workspace = await this.prisma.workspace.findUnique({
      where: {
        slug: workspaceSlug,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const workspaceId = workspace.id;

    const normalizedEmails = [
      ...new Set(
        emails.map((email) => email.trim().toLowerCase()).filter(Boolean),
      ),
    ];

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invites = await this.prisma.$transaction(
      normalizedEmails.map((email) =>
        this.prisma.workspaceInvite.create({
          data: {
            created_by: userId,
            workspace_id: workspaceId,
            email,
            expires_at: expiresAt,
          },
        }),
      ),
    );

    for (const invite of invites) {
      const inviteUrl = `${appUrl}/invite/${invite.id}/accept`;
      const { data, error } = await resend.emails.send({
        from: `Admin <system@themidnightletters.com>`,
        to: [invite.email],
        subject: `${appUrl}/invite/${invite.id}/accept`,
        text: `
        You've been invited to join a workspace.

        Accept your invitation:
        ${inviteUrl}

        This invitation expires in 7 days.

        If you weren't expecting this email, you can safely ignore it.
        `,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited to join a workspace</h2>

          <p>
            Someone has invited you to collaborate in a workspace.
          </p>

          <p>
            Click the button below to accept your invitation:
          </p>

          <p>
            <a
              href="${inviteUrl}"
              style="
                display:inline-block;
                padding:12px 20px;
                background:#111827;
                color:#ffffff;
                text-decoration:none;
                border-radius:8px;
              "
            >
              Accept Invitation
            </a>
          </p>

          <p>
            This invitation expires in 7 days.
          </p>

          <p>
            If the button doesn't work, copy and paste this URL into your browser:
          </p>

          <p style="word-break: break-all;">
            ${inviteUrl}
          </p>

          <hr />

          <p style="color:#666;font-size:12px;">
            If you weren't expecting this invitation, you can safely ignore this email.
          </p>
        </div>`,
      });

      console.log(error);
    }

    return invites;
  }
}
