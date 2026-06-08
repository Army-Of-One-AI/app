/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import useGetProjectDetailsBySlug from "@/features/projects/hooks/useGetProjectDetailsBySlug";
import useGetProjectSummary from "@/features/projects/hooks/useGetProjectSummary";
import useSlugs from "@/shared/hooks/useSlugs";
import { classNames, projectStatusColors } from "@/shared/styles/classNames";
import { TASK_STATUS_ORDER, TaskStatus } from "@/shared/types/enums";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Layers3,
  ListTodo,
  Sparkles,
  SquareCheck,
  TimerReset,
  Users,
} from "lucide-react";

const cardClass =
  "rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] shadow-sm";
const mutedTextClass = "text-[var(--text-secondary)]";
const iconBoxClass =
  "flex size-10 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--text-secondary)]";
const skeletonClass = "animate-pulse rounded-md bg-[var(--border)]";

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getInitials(name?: string | null) {
  if (!name) return "?";

  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getDateHint(value: string | null, label: string) {
  if (!value) return `${label} is not scheduled`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = new Date(value);
  date.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays > 1) return `${diffDays} days away`;
  if (diffDays === -1) return "Yesterday";

  return `${Math.abs(diffDays)} days ago`;
}

export default function ProjectOverviewPage() {
  const slugs = useSlugs();
  const workspaceSlug = slugs.workspace.slug;
  const projectSlug = slugs.project.slug;
  const projectBaseUrl = `/${workspaceSlug}/projects/${projectSlug}`;

  const {
    data: project,
    isLoading,
    error,
  } = useGetProjectDetailsBySlug(projectSlug, workspaceSlug);

  const { data: summary, isLoading: isSummaryLoading } = useGetProjectSummary(
    projectSlug,
    workspaceSlug
  );

  if (isLoading) {
    return <ProjectOverviewSkeleton />;
  }

  if (error || !project) {
    return (
      <div
        className={`rounded-xl border p-5 text-sm ${classNames.danger.border} ${classNames.danger.bg} ${classNames.danger.text}`}
      >
        Failed to load project overview.
      </div>
    );
  }

  const statusCounts = (summary?.statusCounts ?? {}) as Record<
    TaskStatus,
    number
  >;
  const totalTasks = TASK_STATUS_ORDER.reduce(
    (sum, status) => sum + Number(statusCounts[status] || 0),
    0
  );
  const doneTasks = Number(statusCounts.Done || 0);
  const activeTasks =
    Number(statusCounts.Todo || 0) +
    Number(statusCounts.In_Progress || 0) +
    Number(statusCounts.Review || 0);
  const completionRate =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const description =
    project.description?.plainText?.trim() ||
    "No description has been added for this project yet.";

  const timelineItems = [
    {
      label: "Start date",
      value: formatDate(project.startDate),
      hint: getDateHint(project.startDate, "Start date"),
      icon: CalendarDays,
    },
    {
      label: "Target date",
      value: formatDate(project.targetDate),
      hint: getDateHint(project.targetDate, "Target date"),
      icon: Clock,
    },
    {
      label: "Completed at",
      value: formatDate(project.completedAt),
      hint: project.completedAt
        ? getDateHint(project.completedAt, "Completed")
        : "Not completed",
      icon: CheckCircle2,
    },
  ];

  const quickLinks = [
    {
      label: "Summary",
      description: "Review health, workload, and activity.",
      href: `${projectBaseUrl}/summary`,
      icon: BarChart3,
    },
    {
      label: "Board",
      description: "Plan and move tasks through execution.",
      href: `${projectBaseUrl}/board`,
      icon: ListTodo,
    },
    {
      label: "Epics",
      description: "Group tasks into larger initiatives.",
      href: `${projectBaseUrl}/epics`,
      icon: Sparkles,
    },
    {
      label: "Sprints",
      description: "Group tasks into larger initiatives.",
      href: `${projectBaseUrl}/sprints`,
      icon: TimerReset,
    },
    {
      label: "Documents",
      description: "Open product and planning documents.",
      href: `${projectBaseUrl}/documents`,
      icon: FileText,
    },
  ];

  return (
    <div className="h-full space-y-5 bg-[var(--background)] px-6 py-6">
      <section className={`${cardClass} p-6`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  projectStatusColors[project.status]
                }`}
              >
                {project.status.replaceAll("_", " ")}
              </span>

              <span
                className={`rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium ${mutedTextClass}`}
              >
                {project.slug}
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              {project.name}
            </h1>

            <p className={`mt-2 max-w-3xl text-sm leading-6 ${mutedTextClass}`}>
              {description}
            </p>

            <div
              className={`mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs ${mutedTextClass}`}
            >
              <span>Created {formatDate(project.createdAt)}</span>
              <span>Updated {formatDate(project.updatedAt)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`${projectBaseUrl}/board`}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--on-primary)] shadow-xs transition hover:brightness-95"
            >
              <ListTodo size={16} />
              Open board
            </Link>

            <Link
              href={`${projectBaseUrl}/summary`}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm font-medium text-[var(--text-primary)] shadow-xs transition hover:bg-[var(--secondary)]"
            >
              <BarChart3 size={16} />
              View summary
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <OverviewMetric
          icon={SquareCheck}
          label="Total tasks"
          value={isSummaryLoading ? "-" : totalTasks}
          detail="Across all statuses"
        />
        <OverviewMetric
          icon={CheckCircle2}
          label="Completion"
          value={isSummaryLoading ? "-" : `${completionRate}%`}
          detail={`${doneTasks} tasks done`}
        />
        <OverviewMetric
          icon={ListTodo}
          label="Active work"
          value={isSummaryLoading ? "-" : activeTasks}
          detail="Todo, progress, review"
        />
        <OverviewMetric
          icon={CalendarDays}
          label="Due soon"
          value={isSummaryLoading ? "-" : summary?.tasksDueNext7DaysCount ?? 0}
          detail="Next 7 days"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className={`${cardClass} p-5`}>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Schedule</h2>
              <p className={`mt-1 text-sm ${mutedTextClass}`}>
                Key project dates and delivery state.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {timelineItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={iconBoxClass}>
                      <Icon className="size-4" />
                    </div>

                    <div className="min-w-0">
                      <p className={`text-sm ${mutedTextClass}`}>
                        {item.label}
                      </p>
                      <p className="truncate font-medium">{item.value}</p>
                    </div>
                  </div>
                  <p className={`mt-3 text-xs ${mutedTextClass}`}>
                    {item.hint}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <section className={`${cardClass} p-5`}>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Members</h2>
              <p className={`mt-1 text-sm ${mutedTextClass}`}>
                {project.members.length} member
                {project.members.length === 1 ? "" : "s"} assigned
              </p>
            </div>

            <Users className={`size-5 ${mutedTextClass}`} />
          </div>

          {project.members.length > 0 ? (
            <div className="space-y-2">
              {project.members.slice(0, 6).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3"
                >
                  {member.avatarURL ? (
                    <img
                      src={member.avatarURL}
                      alt={member.fullName ?? member.username}
                      className="size-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-9 items-center justify-center rounded-full bg-[var(--secondary)] text-sm font-semibold text-[var(--text-secondary)]">
                      {getInitials(member.fullName ?? member.username)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {member.fullName ?? member.username}
                    </p>
                    <p className={`truncate text-xs ${mutedTextClass}`}>
                      {member.email}
                    </p>
                  </div>
                </div>
              ))}

              {project.members.length > 6 && (
                <p className={`pt-1 text-xs ${mutedTextClass}`}>
                  +{project.members.length - 6} more members
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center">
              <Users className={`mx-auto mb-3 size-5 ${mutedTextClass}`} />
              <p className="text-sm font-medium text-[var(--text-primary)]">
                No members found
              </p>
              <p className={`mt-1 text-xs ${mutedTextClass}`}>
                Add project members so ownership is clear.
              </p>
            </div>
          )}
        </section>
      </section>

      <section className={`${cardClass} p-5`}>
        <div className="mb-4">
          <h2 className="text-base font-semibold">Project workspace</h2>
          <p className={`mt-1 text-sm ${mutedTextClass}`}>
            Jump into the views that move the project forward.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;

            return (
              <Link
                key={link.label}
                href={link.href}
                className="group rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:shadow-md"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className={iconBoxClass}>
                    <Icon className="size-4" />
                  </div>
                  <ArrowRight
                    className={`size-4 transition group-hover:translate-x-0.5 ${mutedTextClass}`}
                  />
                </div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  {link.label}
                </h3>
                <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>
                  {link.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function OverviewMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof SquareCheck;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className={`${cardClass} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm ${mutedTextClass}`}>{label}</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
            {value}
          </p>
          <p className={`mt-1 text-xs ${mutedTextClass}`}>{detail}</p>
        </div>

        <div className={iconBoxClass}>
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}

function ProjectOverviewSkeleton() {
  return (
    <div className="h-full space-y-5 bg-[var(--background)] px-6 py-6">
      <section className={`${cardClass} p-6`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className={`mb-4 h-6 w-32 ${skeletonClass}`} />
            <div className={`h-8 w-72 max-w-full ${skeletonClass}`} />
            <div className={`mt-3 h-4 w-full max-w-2xl ${skeletonClass}`} />
            <div className={`mt-2 h-4 w-2/3 max-w-xl ${skeletonClass}`} />
          </div>
          <div className="flex gap-2">
            <div className={`h-10 w-28 rounded-xl ${skeletonClass}`} />
            <div className={`h-10 w-32 rounded-xl ${skeletonClass}`} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={`${cardClass} p-4`}>
            <div className={`mb-4 size-10 rounded-xl ${skeletonClass}`} />
            <div className={`h-4 w-24 ${skeletonClass}`} />
            <div className={`mt-3 h-7 w-16 ${skeletonClass}`} />
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className={`${cardClass} p-5`}>
          <div className={`mb-5 h-5 w-32 ${skeletonClass}`} />
          <div className="grid gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-[var(--border)] p-4"
              >
                <div className={`size-10 rounded-xl ${skeletonClass}`} />
                <div className={`mt-4 h-4 w-24 ${skeletonClass}`} />
                <div className={`mt-2 h-4 w-20 ${skeletonClass}`} />
              </div>
            ))}
          </div>
        </div>

        <div className={`${cardClass} p-5`}>
          <div className={`mb-5 h-5 w-28 ${skeletonClass}`} />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`size-9 rounded-full ${skeletonClass}`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-4 w-32 ${skeletonClass}`} />
                  <div className={`h-3 w-48 ${skeletonClass}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
