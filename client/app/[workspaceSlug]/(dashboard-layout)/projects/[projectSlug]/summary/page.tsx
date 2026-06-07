"use client";

import useSlugs from "@/shared/hooks/useSlugs";
import { classNames } from "@/shared/styles/classNames";
import { TASK_STATUS_ORDER, TaskStatus } from "@/shared/types/enums";
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  SquareCheck,
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

  const openTask = (taskId?: string) => {
    if (!taskId) return;

    router.push(
      `/${workspaceSlug}/projects/${projectSlug}/board?selectedTask=${taskId}`
    );
  };

  return (
    <div className="space-y-5 py-4 max-w-7xl mx-auto">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetricCard
          icon={CheckCircle2}
          value={data?.tasksCompletedLast7DaysCount ?? 0}
          label="Completed"
          subLabel="Last 7 days"
          loading={isLoading}
        />

        <SummaryMetricCard
          icon={Workflow}
          value={data?.tasksUpdatedLast7DaysCount ?? 0}
          label="Updated"
          subLabel="Last 7 days"
          loading={isLoading}
        />

        <SummaryMetricCard
          icon={SquareCheck}
          value={data?.tasksCreatedLast7DaysCount ?? 0}
          label="Created"
          subLabel="Last 7 days"
          loading={isLoading}
        />

        <SummaryMetricCard
          icon={CalendarDays}
          value={data?.tasksDueNext7DaysCount ?? 0}
          label="Due soon"
          subLabel="Next 7 days"
          loading={isLoading}
        />
      </section>

      <section className="grid gap-4">
        <div className="grid gap-4 xl:grid-cols-2">
          <StatusOverviewCard
            statusCounts={statusCounts}
            totalTasks={totalTasks}
          />

          <RecentActivityCard
            activities={data?.recentActivities ?? []}
            loading={isLoading}
            onTaskClick={openTask}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <PriorityBreakdownChart priorityCounts={data?.priorityCounts ?? {}} />
          <AssigneeWorkloadChart assignees={data?.tasksByAssignee ?? []} />
        </div>
      </section>
    </div>
  );
}
