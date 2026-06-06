import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { WorkspaceInvite } from 'generated/prisma/client';

export const EMAILS_QUEUE = 'emails';

@Injectable()
export class EmailsService {
  private logger = new Logger(EmailsService.name);

  constructor(
    @InjectQueue(EMAILS_QUEUE)
    private readonly emailsQueue: Queue,
  ) {}

  async enqueueWorkspaceInvitationEmailQueue(
    invites: WorkspaceInvite[],
  ): Promise<void> {
    try {
      await this.emailsQueue.addBulk(
        invites.map((invite) => ({
          name: 'workspace-invitation',
          data: {
            inviteId: invite.id,
          },
          opts: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
            removeOnComplete: true,
            removeOnFail: false,
          },
        })),
      );
    } catch (error) {
      this.logger.error(
        'Failed to enqueue workspace invitation emails',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
