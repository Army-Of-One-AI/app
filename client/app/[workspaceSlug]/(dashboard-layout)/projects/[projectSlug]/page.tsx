"use client";

import useGetProjectDetailsBySlug from "@/features/projects/hooks/useGetProjectDetailsBySlug";
import useSlugs from "@/shared/hooks/useSlugs";
import { classNames, projectStatusColors } from "@/shared/styles/classNames";
import { parseRichText } from "@/shared/utils/helpers";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Hash,
  Loader2,
  Plus,
} from "lucide-react";

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function ProjectDetailsPage() {
  const slugs = useSlugs();
  const workspaceSlug = slugs.workspace.slug;
  const projectSlug = slugs.project.slug;

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

  const description = parseRichText(project.description).html;

  const members = (project as any).members ?? [];
  const tasks = (project as any).tasks ?? [];

  const doneTasks = tasks.filter((task: any) => task.status === "Done").length;
  const totalTasks = tasks.length;

  const recentTasks = tasks.slice(0, 5);

  return (
    <div className="grid gap-5 py-4 lg:grid-cols-[minmax(0,1fr)_350px]">
      <main className="space-y-5">
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                About this project
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Goal, scope, and current bets
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                projectStatusColors[project.status]
              }`}
            >
              {project.status}
            </span>
          </div>

          <div className="mt-5">
            {description ? (
              <div
                className="rich-text text-sm leading-7 text-[var(--text-primary)]"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            ) : (
              <p className="text-sm leading-7 text-[var(--text-secondary)]">
                No description has been added for this project yet.
              </p>
            )}
          </div>

          <div className="mt-6 divide-y divide-[var(--border)]">
            <GoalRow
              checked={Boolean(project.startDate)}
              text="Project started"
              value={formatDate(project.startDate)}
            />
            <GoalRow
              checked={Boolean(project.targetDate)}
              text="Target deadline"
              value={formatDate(project.targetDate)}
            />
            <GoalRow
              checked={Boolean(project.completedAt)}
              text="Project completed"
              value={formatDate(project.completedAt)}
            />
          </div>
        </section>

        <section className="grid gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:grid-cols-3">
          <OverviewCard
            value={`${doneTasks}/${totalTasks || 0}`}
            label="Tasks done"
          />
          <OverviewCard
            value={formatDate(project.targetDate)}
            label="Deadline"
          />
          <OverviewCard value={project.status} label="Current status" />
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Recent Tasks
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {recentTasks.length} of {totalTasks} tasks
              </p>
            </div>

            <div className="flex gap-2">
              <button className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--secondary)]">
                View all
              </button>
              <button className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--secondary)]">
                + New
              </button>
            </div>
          </div>

          <div className="mt-5 divide-y divide-[var(--border)]">
            {recentTasks.length > 0 ? (
              recentTasks.map((task: any) => (
                <TaskRow
                  key={task.id}
                  title={task.title}
                  subtitle={
                    task.dueDate
                      ? `Due ${formatDate(task.dueDate)}`
                      : "No due date"
                  }
                  status={task.status}
                  avatar={task.assignee?.avatarURL || task.assignee?.avatar}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border)] py-8 text-center">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  No tasks yet
                </p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Create tasks to start tracking project progress.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <aside className="space-y-5">
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Team
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {members.length} members
              </p>
            </div>

            <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
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

        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
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
      </aside>
    </div>
  );
}

function GoalRow({
  checked,
  text,
  value,
}: {
  checked: boolean;
  text: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
          checked
            ? "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]"
            : "border-[var(--border)] text-transparent"
        }`}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
      </div>

      <p className="min-w-0 flex-1 text-sm font-medium text-[var(--text-primary)]">
        {text}
      </p>

      <p className="text-sm text-[var(--text-secondary)]">{value}</p>
    </div>
  );
}

function OverviewCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-r border-[var(--border)] px-2 last:border-r-0 max-sm:border-r-0">
      <p className="text-2xl font-semibold text-[var(--text-primary)]">
        {value}
      </p>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">{label}</p>
    </div>
  );
}

function TaskRow({
  title,
  subtitle,
  status,
  avatar,
}: {
  title: string;
  subtitle: string;
  status: string;
  avatar?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="h-4 w-4 rounded border border-[var(--border)]" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
          {title}
        </p>
        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
          {subtitle}
        </p>
      </div>

      <span className="text-xs font-semibold text-[var(--text-primary)]">
        {status}
      </span>

      {avatar && (
        <img
          src={avatar}
          alt=""
          className="h-7 w-7 rounded-full object-cover"
        />
      )}
    </div>
  );
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
      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[var(--primary)]/15 text-sm font-semibold text-[var(--primary)]">
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
