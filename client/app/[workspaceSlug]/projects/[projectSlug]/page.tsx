"use client";

import useGetProjectDetailsBySlug from "@/features/projects/hooks/useGetProjectDetailsBySlug";
import { classNames, projectStatusColors } from "@/shared/styles/classNames";
import { parseRichText } from "@/shared/utils/helpers";
import { CalendarDays, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const projectSlug = params.projectSlug as string;
  const {
    data: project,
    isLoading,
    error,
  } = useGetProjectDetailsBySlug(projectSlug, workspaceSlug);

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--text-secondary)]" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className={`rounded-xl border p-4 text-sm ${classNames.danger.border} ${classNames.danger.bg} ${classNames.danger.text}`}>
        Failed to load project details.
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                {project.name}
              </h1>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${projectStatusColors[project.status]
                  }`}
              >
                {project.status}
              </span>
            </div>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              /{project.slug}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] p-4">
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <CalendarDays size={16} />
              Start date
            </div>
            <p className="mt-2 font-medium text-[var(--text-primary)]">
              {formatDate(project.startDate)}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border)] p-4">
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Clock size={16} />
              Target date
            </div>
            <p className="mt-2 font-medium text-[var(--text-primary)]">
              {formatDate(project.targetDate)}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border)] p-4">
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <CheckCircle2 size={16} />
              Completed at
            </div>
            <p className="mt-2 font-medium text-[var(--text-primary)]">
              {formatDate(project.completedAt)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xs">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Description
        </h2>

        <div
          className="rich-text"
          dangerouslySetInnerHTML={{ __html: parseRichText(project.description).html }}
        />
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xs">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Project info
        </h2>

        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <InfoRow label="Created at" value={formatDate(project.createdAt)} />
          <InfoRow label="Updated at" value={formatDate(project.updatedAt)} />
          <InfoRow label="Project ID" value={project.id} />
          <InfoRow label="Slug" value={project.slug} />
        </div>
      </section>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--background)] px-4 py-3">
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 break-all font-medium text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}
