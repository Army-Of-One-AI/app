import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import PrismaService from 'src/shared/services/prisma.service';
import { EMAILS_QUEUE } from '../emails.service';

type WorkspaceInvitationJobData = {
  inviteId: string;
};

@Processor(EMAILS_QUEUE)
@Injectable()
export class EmailsProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailsProcessor.name);
  private readonly resend: Resend;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    super();

    const apiKey = this.configService.getOrThrow<string>('RESEND_API_KEY');

    this.resend = new Resend(apiKey);
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'workspace-invitation':
        return this.processWorkspaceInvitation(
          job as Job<WorkspaceInvitationJobData>,
        );

      default:
        this.logger.warn(`Unknown email job: ${job.name}`);
    }
  }

  private async processWorkspaceInvitation(
    job: Job<WorkspaceInvitationJobData>,
  ): Promise<void> {
    const { inviteId } = job.data;

    const invite = await this.prisma.workspaceInvite.findUnique({
      where: {
        id: inviteId,
      },
      include: {
        workspace: true,
      },
    });

    if (!invite) {
      this.logger.warn(`Workspace invite not found: ${inviteId}`);
      return;
    }

    const appUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const url = `${appUrl}/invite/${invite.id}/accept`;

    const { error } = await this.resend.emails.send({
      from: 'Admin <system@themidnightletters.com>',
      to: [invite.email],
      subject: `You're invited to ${invite.workspace.name}`,
      html: `
        <div>
          <h2>You're invited to ${invite.workspace.name}</h2>
          <p>Click the link below to accept your invitation:</p>
          <a href="${url}">Accept invitation</a>
        </div>
      `,
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}
