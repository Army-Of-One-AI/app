"use client";

import useSlugs from "@/shared/hooks/useSlugs";
import { classNames } from "@/shared/styles/classNames";
import { TASK_STATUS_ORDER, TaskStatus } from "@/shared/types/enums";
import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  CircleDot,
  ClipboardList,
  ListTodo,
  SquareCheck,
  TrendingUp,
  Workflow,
} from "lucide-react";
import { useRouter } from "next/navigation";
import RecentActivityCard from "./components/RecentActivityCard";
import StatusOverviewCard from "./components/StatusOverviewCard";
import PriorityBreakdownChart from "./components/PriorityBreakdownChart";
import SummaryMetricCard from "./components/SummaryMetricCard";
import AssigneeWorkloadChart from "./components/AssigneeWorkloadChart";
import useGetProjectSummary from "@/features/projects/hooks/useGetProjectSummary";
import SkeletonLoading from "./components/SkeletonLoading";

const emptyFilterValue = "__empty__";

export default function ProjectSummaryPage() {
  const router = useRouter();
  const slugs = useSlugs();

  const workspaceSlug = slugs.workspace.slug;
  const projectSlug = slugs.project.slug;

  const { data, error, isLoading } = useGetProjectSummary(
    projectSlug,
    workspaceSlug
  );

  if (isLoading) {
    return <SkeletonLoading />;
  }

  if (error || !data) {
    return (
      <div
        className={`rounded-2xl border p-4 text-sm ${classNames.danger.border} ${classNames.danger.bg} ${classNames.danger.text}`}
      >
        Failed to load project summary.
      </div>
    );
  }

  const statusCounts = (data?.statusCounts ?? {}) as Record<TaskStatus, number>;

  const totalTasks = TASK_STATUS_ORDER.reduce(
    (sum, status) => sum + Number(statusCounts[status] || 0),
    0
  );
  const doneTasks = Number(statusCounts.Done || 0);
  const activeTasks =
    Number(statusCounts.Todo || 0) +
    Number(statusCounts.In_Progress || 0) +
    Number(statusCounts.Review || 0);
  const reviewTasks = Number(statusCounts.Review || 0);
  const completionRate =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const openTask = (taskId?: string) => {
    if (!taskId) return;

    router.push(
      `/${workspaceSlug}/projects/${projectSlug}/board?selectedTask=${taskId}`
    );
  };

  const openBoard = (params?: Record<string, string>) => {
    const query = new URLSearchParams(params);
    const queryString = query.toString();

    router.push(
      `/${workspaceSlug}/projects/${projectSlug}/board${
        queryString ? `?${queryString}` : ""
      }`
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 py-4">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <ClipboardList size={16} />
              <span className="truncate">{projectSlug}</span>
            </div>

            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Project summary
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
              Track execution health, workload, and recent task movement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openBoard()}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm font-medium text-[var(--text-primary)] shadow-xs transition hover:bg-[var(--secondary)]"
            >
              <ListTodo size={16} />
              View board
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetricCard
          icon={CheckCircle2}
          value={data?.tasksCompletedLast7DaysCount ?? 0}
          label="Completed"
          subLabel="Last 7 days"
          detail={`${completionRate}% total completion`}
          loading={isLoading}
        />

        <SummaryMetricCard
          icon={Workflow}
          value={data?.tasksUpdatedLast7DaysCount ?? 0}
          label="Updated"
          subLabel="Last 7 days"
          detail={`${activeTasks} active tasks`}
          loading={isLoading}
        />

        <SummaryMetricCard
          icon={SquareCheck}
          value={data?.tasksCreatedLast7DaysCount ?? 0}
          label="Created"
          subLabel="Last 7 days"
          detail={`${totalTasks} total tasks`}
          loading={isLoading}
        />

        <SummaryMetricCard
          icon={CalendarDays}
          value={data?.tasksDueNext7DaysCount ?? 0}
          label="Due soon"
          subLabel="Next 7 days"
          detail="Needs scheduling focus"
          loading={isLoading}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <HealthSignalCard
          icon={TrendingUp}
          label="Completion rate"
          value={`${completionRate}%`}
          detail={`${doneTasks} of ${totalTasks} tasks done`}
          tone={completionRate >= 70 ? "good" : completionRate >= 35 ? "warn" : "muted"}
          onClick={() => openBoard({ status: TaskStatus.Done })}
        />

        <HealthSignalCard
          icon={CircleDot}
          label="Work in motion"
          value={activeTasks}
          detail="Todo, in progress, and review"
          tone="info"
          onClick={() =>
            openBoard({
              status: [
                TaskStatus.Todo,
                TaskStatus.In_Progress,
                TaskStatus.Review,
              ].join(","),
            })
          }
        />

        <HealthSignalCard
          icon={CircleAlert}
          label="Review queue"
          value={reviewTasks}
          detail="Tasks waiting for validation"
          tone={reviewTasks > 0 ? "warn" : "good"}
          onClick={() => openBoard({ status: TaskStatus.Review })}
        />
      </section>

      <section className="grid gap-4">
        <div className="grid gap-4 xl:grid-cols-2">
          <StatusOverviewCard
            statusCounts={statusCounts}
            totalTasks={totalTasks}
            onStatusClick={(status) => openBoard({ status })}
          />

          <RecentActivityCard
            activities={data?.recentActivities ?? []}
            loading={isLoading}
            onTaskClick={openTask}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <PriorityBreakdownChart
            priorityCounts={data?.priorityCounts ?? {}}
            onPriorityClick={(priority) => openBoard({ priority })}
          />
          <AssigneeWorkloadChart
            assignees={data?.tasksByAssignee ?? []}
            onAssigneeClick={(assigneeId) =>
              openBoard({
                assignee:
                  assigneeId === "__unassigned"
                    ? "__unassigned__"
                    : assigneeId || emptyFilterValue,
              })
            }
          />
        </div>
      </section>
    </div>
  );
}

function HealthSignalCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
  onClick,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string | number;
  detail: string;
  tone: "good" | "warn" | "info" | "muted";
  onClick: () => void;
}) {
  const toneClass = {
    good:
      "bg-[var(--task-status-done-bg)] text-[var(--task-status-done-text)]",
    warn:
      "bg-[var(--priority-high-bg)] text-[var(--priority-high-text)]",
    info: "bg-[var(--primary)]/12 text-[var(--primary)]",
    muted: "bg-[var(--secondary)] text-[var(--text-secondary)]",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
            {value}
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{detail}</p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass}`}
        >
          <Icon size={18} />
        </div>
      </div>
    </button>
  );
}
