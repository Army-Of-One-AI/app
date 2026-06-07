/* eslint-disable @next/next/no-img-element */
"use client";

import useGetProjectDetailsBySlug from "@/features/projects/hooks/useGetProjectDetailsBySlug";
import useSlugs from "@/shared/hooks/useSlugs";
import { classNames } from "@/shared/styles/classNames";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Users,
} from "lucide-react";

const sectionClass = `rounded-3xl border ${classNames.border} ${classNames.surface} text-[var(--text-primary)] shadow-sm`;
const cardClass = `rounded-2xl border ${classNames.border} ${classNames.surface} text-[var(--text-primary)] shadow-sm`;
const mutedTextClass = "text-[var(--text-secondary)]";
const iconBoxClass =
  "flex size-10 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--text-secondary)]";
const memberCardClass = `flex items-center gap-3 rounded-2xl border ${classNames.border} p-3`;
const avatarFallbackClass =
  "flex size-10 items-center justify-center rounded-full bg-[var(--text-primary)] text-[var(--surface-primary)] text-sm font-semibold";

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

export default function ProjectOverviewPage() {
  const slugs = useSlugs();

  const {
    data: project,
    isLoading,
    error,
  } = useGetProjectDetailsBySlug(slugs.project.slug, slugs.workspace.slug);

  if (isLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-[var(--text-secondary)]" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        Failed to load project overview.
      </div>
    );
  }

  const timelineItems = [
    {
      label: "Start date",
      value: formatDate(project.startDate),
      icon: CalendarDays,
    },
    {
      label: "Target date",
      value: formatDate(project.targetDate),
      icon: Clock,
    },
    {
      label: "Completed at",
      value: formatDate(project.completedAt),
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-6">
      <section className={`${sectionClass} p-6`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span
                className={`rounded-full border ${classNames.border} px-3 py-1 text-xs font-medium ${mutedTextClass}`}
              >
                {project.status.replaceAll("_", " ")}
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">
              {project.name}
            </h1>

            <p className={`mt-2 max-w-2xl text-sm leading-6 ${mutedTextClass}`}>
              {project.description
                ? "Project description is available."
                : "No description has been added for this project yet."}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {timelineItems.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.label} className={`${cardClass} p-5`}>
              <div className="flex items-center gap-3">
                <div className={iconBoxClass}>
                  <Icon className="size-4" />
                </div>

                <div>
                  <p className={`text-sm ${mutedTextClass}`}>{item.label}</p>
                  <p className="font-medium">{item.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className={`${sectionClass} p-6`}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Members</h2>
            <p className={`text-sm ${mutedTextClass}`}>
              {project.members.length} member
              {project.members.length === 1 ? "" : "s"} in this project
            </p>
          </div>

          <Users className={`size-5 ${mutedTextClass}`} />
        </div>

        {project.members.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {project.members.map((member) => (
              <div key={member.id} className={memberCardClass}>
                {member.avatarURL ? (
                  <img
                    src={member.avatarURL}
                    alt={member.fullName ?? member.username}
                    className="size-10 rounded-full object-cover"
                  />
                ) : (
                  <div className={avatarFallbackClass}>
                    {getInitials(member.fullName ?? member.username)}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {member.fullName ?? member.username}
                  </p>
                  <p className={`truncate text-xs ${mutedTextClass}`}>
                    {member.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className={`rounded-2xl border border-dashed ${classNames.border} p-6 text-center text-sm ${mutedTextClass}`}
          >
            No members found.
          </div>
        )}
      </section>
    </div>
  );
}
