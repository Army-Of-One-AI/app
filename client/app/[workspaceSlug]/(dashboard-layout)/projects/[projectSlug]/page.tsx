"use client";

import useGetProjectDetailsBySlug from "@/features/projects/hooks/useGetProjectDetailsBySlug";
import useGetProjectSummary from "@/features/projects/hooks/useGetProjectSummary";
import useSlugs from "@/shared/hooks/useSlugs";
import { classNames, taskStatusConfig } from "@/shared/styles/classNames";
import { TaskStatus } from "@/shared/types/enums";
import { formatDate } from "@/shared/utils/helpers";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Loader2,
  Plus,
  SquareCheck,
  Workflow,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

const TASK_STATUS_ORDER: TaskStatus[] = [
  "Backlog",
  "Todo",
  "In_Progress",
  "Review",
  "Done",
  "Canceled",
];

const TASK_STATUS_CHART_COLORS: Record<TaskStatus, string> = {
  Backlog: taskStatusConfig.Backlog.text,
  Todo: taskStatusConfig.Todo.text,
  In_Progress: taskStatusConfig.In_Progress.text,
  Review: taskStatusConfig.Review.text,
  Done: taskStatusConfig.Done.text,
  Canceled: taskStatusConfig.Canceled.text,
};

function buildConicGradient(items: { status: TaskStatus; count: number }[]) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) return "var(--secondary)";

  let current = 0;

  return items
    .map((item) => {
      const start = current;
      const end = current + (item.count / total) * 100;
      current = end;

      return `${TASK_STATUS_CHART_COLORS[item.status]} ${start}% ${end}%`;
    })
    .join(", ");
}

export default function ProjectDetailsPage() {
  const router = useRouter();
  const slugs = useSlugs();

  const workspaceSlug = slugs.workspace.slug;
  const projectSlug = slugs.project.slug;

  const { data: projectSummary, isLoading: isSummaryLoading } =
    useGetProjectSummary(projectSlug, workspaceSlug);

  const {
    data: project,
    isLoading,
    error,
  } = useGetProjectDetailsBySlug(projectSlug, workspaceSlug);

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--text-secondary)]" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div
        className={`rounded-2xl border p-4 text-sm ${classNames.danger.border} ${classNames.danger.bg} ${classNames.danger.text}`}
      >
        Failed to load project details.
      </div>
    );
  }

  const members = (project as any).members ?? [];

  const statusCounts = (projectSummary?.statusCounts ?? {}) as Record<
    TaskStatus,
    number
  >;

  const totalTasks = TASK_STATUS_ORDER.reduce(
    (sum, status) => sum + Number(statusCounts[status] || 0),
    0
  );

  const openTask = (taskId?: string) => {
    if (!taskId) return;

    router.push(
      `/${workspaceSlug}/projects/${projectSlug}/board?selectedTask=${taskId}`
    );
  };

  return (
    <div className="space-y-5 py-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetricCard
          icon={CheckCircle2}
          value={projectSummary?.tasksCompletedLast7DaysCount ?? 0}
          label="Completed"
          subLabel="Last 7 days"
          loading={isSummaryLoading}
        />

        <SummaryMetricCard
          icon={Workflow}
          value={projectSummary?.tasksUpdatedLast7DaysCount ?? 0}
          label="Updated"
          subLabel="Last 7 days"
          loading={isSummaryLoading}
        />

        <SummaryMetricCard
          icon={SquareCheck}
          value={projectSummary?.tasksCreatedLast7DaysCount ?? 0}
          label="Created"
          subLabel="Last 7 days"
          loading={isSummaryLoading}
        />

        <SummaryMetricCard
          icon={CalendarDays}
          value={projectSummary?.tasksDueNext7DaysCount ?? 0}
          label="Due soon"
          subLabel="Next 7 days"
          loading={isSummaryLoading}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <StatusOverviewCard
          statusCounts={statusCounts}
          totalTasks={totalTasks}
        />

        <RecentActivityCard
          activities={projectSummary?.recentActivities ?? []}
          loading={isSummaryLoading}
          onTaskClick={openTask}
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_350px]">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Project info
          </h2>

          <div className="mt-5 divide-y divide-[var(--border)]">
            <InfoRow label="Name" value={project.name} />
            <InfoRow label="Status" value={project.status} />
            <InfoRow label="Started" value={formatDate(project.startDate)} />
            <InfoRow label="Deadline" value={formatDate(project.targetDate)} />
            <InfoRow label="Created" value={formatDate(project.createdAt)} />
            <InfoRow label="Updated" value={formatDate(project.updatedAt)} />
            <InfoRow label="Slug" value={project.slug} />
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Team
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {members.length} members
              </p>
            </div>

            <button className="rounded-lg border border-[var(--border)] p-2 text-[var(--text-secondary)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 divide-y divide-[var(--border)]">
            {members.length > 0 ? (
              members.map((member: any) => (
                <MemberRow
                  key={member.id}
                  name={member.fullName || member.username || member.email}
                  role={member.role || "Member"}
                  avatar={member.avatarURL || member.avatar}
                />
              ))
            ) : (
              <p className="py-6 text-center text-sm text-[var(--text-secondary)]">
                No members found.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryMetricCard({
  icon: Icon,
  value,
  label,
  subLabel,
  loading,
}: {
  icon: any;
  value: number;
  label: string;
  subLabel: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
            {loading ? "—" : value}
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
            {label}
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            {subLabel}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--text-secondary)]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function StatusOverviewCard({
  statusCounts,
  totalTasks,
}: {
  statusCounts: Record<TaskStatus, number>;
  totalTasks: number;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Status overview
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Snapshot of current work items by status.
          </p>
        </div>

        <button className="text-sm font-medium text-[var(--primary)] hover:underline">
          View all
        </button>
      </div>

      <div className="mt-6 grid gap-7 md:grid-cols-[260px_1fr]">
        <StatusDonutChart statusCounts={statusCounts} totalTasks={totalTasks} />

        <div className="flex flex-col justify-center gap-3">
          {TASK_STATUS_ORDER.map((status) => {
            const count = Number(statusCounts[status] || 0);
            const percent =
              totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;

            return (
              <StatusLegendRow
                key={status}
                status={status}
                count={count}
                percent={percent}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StatusDonutChart({
  statusCounts,
  totalTasks,
}: {
  statusCounts: Record<TaskStatus, number>;
  totalTasks: number;
}) {
  const items = TASK_STATUS_ORDER.map((status) => ({
    status,
    count: Number(statusCounts[status] || 0),
  })).filter((item) => item.count > 0);

  const gradient = buildConicGradient(items);

  return (
    <div className="flex items-center justify-center">
      <div
        className="relative h-52 w-52 rounded-full shadow-inner"
        style={{ background: `conic-gradient(${gradient})` }}
      >
        <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]">
          <p className="text-3xl font-semibold text-[var(--text-primary)]">
            {totalTasks}
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
            Total tasks
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusLegendRow({
  status,
  count,
  percent,
}: {
  status: TaskStatus;
  count: number;
  percent: number;
}) {
  const config = taskStatusConfig[status];

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl px-2 py-1.5 hover:bg-[var(--secondary)]">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: config.text }}
        />
        <span className="truncate text-sm font-medium text-[var(--text-primary)]">
          {config.label}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2 text-sm">
        <span className="font-semibold text-[var(--text-primary)]">
          {count}
        </span>
        <span className="text-[var(--text-secondary)]">{percent}%</span>
      </div>
    </div>
  );
}

function RecentActivityCard({
  activities,
  loading,
  onTaskClick,
}: {
  activities: any[];
  loading?: boolean;
  onTaskClick: (taskId?: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Recent activity
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Latest task changes in this project.
          </p>
        </div>

        <button className="rounded-lg border border-[var(--border)] p-2 text-[var(--text-secondary)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]">
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 max-h-[330px] space-y-4 overflow-y-auto pr-2">
        {loading ? (
          <p className="text-sm text-[var(--text-secondary)]">
            Loading activities...
          </p>
        ) : activities.length > 0 ? (
          activities.map((activity) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              onTaskClick={onTaskClick}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--border)] py-8 text-center">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              No recent activity
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Task updates will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function ActivityRow({
  activity,
  onTaskClick,
}: {
  activity: any;
  onTaskClick: (taskId?: string) => void;
}) {
  const actorName = activity.actor?.fullName || "Someone";
  const avatar = activity.actor?.avatarURL;
  const initial = actorName.slice(0, 2).toUpperCase();

  return (
    <div className="group flex gap-3 rounded-xl p-2 transition hover:bg-[var(--secondary)]">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--primary)]/15 text-xs font-bold text-[var(--primary)]">
        {avatar ? (
          <img
            src={avatar}
            alt={actorName}
            className="h-full w-full object-cover"
          />
        ) : (
          initial
        )}
      </div>

      <div className="min-w-0 flex-1">
        <ActivityContent activity={activity} onTaskClick={onTaskClick} />

        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          {formatRelativeTime(activity.createdAt)}
        </p>
      </div>
    </div>
  );
}

function ActivityContent({
  activity,
  onTaskClick,
}: {
  activity: any;
  onTaskClick: (taskId?: string) => void;
}) {
  const actorName = activity.actor?.fullName || "Someone";
  const before = activity.metadata?.before;
  const after = activity.metadata?.after;
  const task = activity.task;
  const taskTitle = task?.title ?? "Unknown task";

  if (activity.activity === "STATUS_CHANGED") {
    return (
      <>
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="font-semibold text-[var(--text-primary)]">
            {actorName}
          </span>
          <span className="text-[var(--text-secondary)]">
            changed status on
          </span>
          <TaskBadge taskId={task?.id} onClick={onTaskClick}>
            {taskTitle}
          </TaskBadge>
          <StatusPill status={task?.status} />
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <StatusPill status={before} />
          <ChevronRight className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
          <StatusPill status={after} />
        </div>
      </>
    );
  }

  if (activity.activity === "DUE_DATE_CHANGED") {
    return (
      <>
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="font-semibold text-[var(--text-primary)]">
            {actorName}
          </span>
          <span className="text-[var(--text-secondary)]">
            changed due date on
          </span>
          <TaskBadge taskId={task?.id} onClick={onTaskClick}>
            {taskTitle}
          </TaskBadge>
          <StatusPill status={task?.status} />
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <ActivityBadge>{before ? formatDate(before) : "None"}</ActivityBadge>
          <ChevronRight className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
          <ActivityBadge>{after ? formatDate(after) : "None"}</ActivityBadge>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-sm">
      <span className="font-semibold text-[var(--text-primary)]">
        {actorName}
      </span>
      <span className="text-[var(--text-secondary)]">
        updated {activity.activity?.replaceAll("_", " ").toLowerCase()}
      </span>
      <TaskBadge taskId={task?.id} onClick={onTaskClick}>
        {taskTitle}
      </TaskBadge>
      <StatusPill status={task?.status} />
    </div>
  );
}

function TaskBadge({
  children,
  taskId,
  onClick,
}: {
  children: ReactNode;
  taskId?: string;
  onClick: (taskId?: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(taskId)}
      disabled={!taskId}
      className="inline-flex max-w-[180px] items-center truncate rounded-md border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-1.5 py-0.5 text-xs font-semibold text-[var(--primary)] transition hover:bg-[var(--primary)]/15 disabled:cursor-default disabled:opacity-70"
    >
      {children}
    </button>
  );
}

function StatusPill({ status }: { status?: TaskStatus | null }) {
  if (!status || !taskStatusConfig[status]) return null;

  const config = taskStatusConfig[status];

  return (
    <span
      className="inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
      style={{
        backgroundColor: config.bg,
        color: config.text,
      }}
    >
      {config.label}
    </span>
  );
}

function ActivityBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-md border border-[var(--border)] bg-[var(--secondary)] px-1.5 py-0.5 text-xs font-medium text-[var(--text-primary)]">
      {children}
    </span>
  );
}

function formatRelativeTime(value: string) {
  const date = new Date(value).getTime();
  const diff = Date.now() - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function MemberRow({
  name,
  role,
  avatar,
}: {
  name: string;
  role: string;
  avatar?: string;
}) {
  const initial = name.slice(0, 1).toUpperCase();

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[var(--secondary)] text-sm font-semibold text-[var(--text-primary)]">
        {avatar ? (
          <img src={avatar} alt={name} className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
          {name}
        </p>
        <p className="truncate text-xs text-[var(--text-secondary)]">{role}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[90px_1fr] gap-4 py-3 text-sm">
      <p className="text-[var(--text-secondary)]">{label}</p>
      <p className="break-all text-right font-semibold text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}
