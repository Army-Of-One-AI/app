import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createClient, ClickHouseClient } from '@clickhouse/client';
import { ConfigService } from '@nestjs/config';
import { toClickHouseDateTime64 } from 'src/shared/utils/utils';
import PrismaService from 'src/shared/services/prisma.service';

@Injectable()
export class ClickHouseService implements OnModuleDestroy {
  private readonly client: ClickHouseClient;

  constructor(
    readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.client = createClient({
      url:
        configService.get<string>('CLICKHOUSE_URL') ?? 'http://localhost:8123',
      username: configService.get<string>('CLICKHOUSE_USERNAME') ?? 'app',
      password: configService.get<string>('CLICKHOUSE_PASSWORD') ?? 'password',
      database: configService.get<string>('CLICKHOUSE_DB') ?? 'task_analytics',
    });

    this.sync().then(() => console.log('Done'));
  }

  async insertTaskActivity(row: {
    id: string;
    taskId: string;
    projectId: string;
    userId?: string | null;
    activity: string;
    metadata?: unknown;
    createdAt: Date;
    actorNameSnapshot: string;
    actorAvatarSnapshot: string;
  }) {
    await this.client.insert({
      table: 'task_activity_logs',
      values: [
        {
          id: row.id,
          task_id: row.taskId,
          project_id: row.projectId,
          user_id: row.userId ?? null,
          activity: row.activity,
          metadata: JSON.stringify(row.metadata ?? {}),
          created_at: toClickHouseDateTime64(row.createdAt),
          actor_name_snapshot: row.actorNameSnapshot,
          actor_avatar_snapshot: row.actorAvatarSnapshot,
        },
      ],
      format: 'JSONEachRow',
    });
  }

  async sync() {
    await this.client.command({
      query: 'TRUNCATE TABLE task_activity_logs',
    });

    const batchSize = 1000;
    let cursor: string | undefined;
    let inserted = 0;

    while (true) {
      const activities = await this.prisma.taskActivityLog.findMany({
        take: batchSize,
        ...(cursor
          ? {
              cursor: {
                id: cursor,
              },
              skip: 1,
            }
          : {}),
        orderBy: {
          created_at: 'asc',
        },
      });

      if (activities.length === 0) break;

      await this.client.insert({
        table: 'task_activity_logs',
        values: activities.map((ac) => ({
          id: ac.id,
          task_id: ac.task_id,
          project_id: ac.project_id,
          user_id: ac.user_id ?? null,
          activity: ac.activity,
          metadata: JSON.stringify(ac.metadata ?? {}),
          created_at: toClickHouseDateTime64(ac.created_at),
          actor_name_snapshot: ac.actor_name_snapshot,
          actor_avatar_snapshot: ac.actor_avatar_snapshot,
        })),
        format: 'JSONEachRow',
      });

      inserted += activities.length;
      cursor = activities[activities.length - 1].id;

      if (activities.length < batchSize) break;
    }

    return {
      inserted,
    };
  }

  async getProjectLatestActivities(projectId: string, limit = 10) {
    const result = await this.client.query({
      query: `
      SELECT *
      FROM task_activity_logs
      WHERE project_id = {projectId:String}
      ORDER BY created_at DESC
      LIMIT {limit:UInt32}
    `,
      query_params: {
        projectId,
        limit,
      },
      format: 'JSONEachRow',
    });

    const rows: {
      id: string;
      task_id: string;
      project_id: string;
      user_id: string | null;
      activity: string;
      metadata: string;
      created_at: string;
      actor_name_snapshot: string;
      actor_avatar_snapshot: string;
    }[] = await result.json();

    return rows;
  }

  async onModuleDestroy() {
    await this.client.close();
  }
}
