import { Project } from "@/features/projects/types";
import { projectStatusColors } from "@/shared/styles/classNames";
import { formatDate, formatStatus } from "@/shared/utils/helpers";
import NextLink from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  FileText,
  Link,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { DateTime } from "luxon";
import MemberStack from "./MemberStack";
import MemberAvatar from "./MemberAvatar";

export function ProjectCard({
  project,
  workspaceSlug,
  currentUserId,
}: {
  project: Project;
  workspaceSlug: string;
  currentUserId?: string;
}) {
  const projectHref = `/${workspaceSlug}/projects/${project.slug}`;
  const boardHref = `${projectHref}/board`;
  const documentsHref = `${projectHref}/documents`;

  const owner = project.members[0];
  const description = project.description?.plainText?.trim();

  const isCurrentUserMember = Boolean(
    currentUserId &&
      project.members.some((member) => member.id === currentUserId)
  );

  return (
    <article
      className={[
        "group relative flex min-h-[300px] overflow-hidden rounded-3xl border bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] transition-all duration-300",
        isCurrentUserMember
          ? "border-[var(--border)] hover:-translate-y-1 hover:border-[var(--border-hover)] hover:shadow-xl"
          : "border-[var(--border)] opacity-85",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />

      {!isCurrentUserMember && (
        <div className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] shadow-sm">
          <LockKeyhole size={12} />
          Locked
        </div>
      )}

      <div className="relative flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 pr-20">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                  projectStatusColors[project.status]
                }`}
              >
                {formatStatus(project.status)}
              </span>

              {project.targetDate && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--secondary)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">
                  <CalendarDays size={13} />
                  {formatDate(project.targetDate)}
                </span>
              )}
            </div>

            <h2 className="truncate text-xl font-semibold tracking-tight text-[var(--text-primary)]">
              {project.name}
            </h2>

            <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-[var(--text-secondary)]">
              <Link size={12} />
              /projects/{project.slug}
            </p>
          </div>
        </div>

        <p className="mt-4 line-clamp-2 min-h-12 text-sm leading-6 text-[var(--text-secondary)]">
          {description ||
            "No description yet. Open the project to add context, planning details, and team notes."}
        </p>

        {!isCurrentUserMember && (
          <div className="mt-4 flex gap-2 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-xs leading-5 text-[var(--text-secondary)]">
            <LockKeyhole
              size={14}
              className="mt-0.5 shrink-0 text-[var(--text-tertiary)]"
            />
            <span>
              You are not a member of this project. Ask a project manager to add
              you before opening the board or documents.
            </span>
          </div>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2">
          <MiniStat label="Tasks" value={project.taskCount.toString()} />
          <MiniStat label="Members" value={project.members.length.toString()} />
          <MiniStat
            label="Created"
            value={DateTime.fromISO(project.createdAt).toFormat("dd LLL")}
          />
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
              <Sparkles size={12} />
              Owner
            </p>

            {owner ? (
              <div className="mt-2 flex min-w-0 items-center gap-2">
                <MemberAvatar member={owner} />
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  {owner.fullName || owner.username}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                No members
              </p>
            )}
          </div>

          <MemberStack members={project.members} />
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
          {isCurrentUserMember ? (
            <>
              <NextLink
                href={projectHref}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--btn-primary-bg)] px-4 text-sm font-semibold text-[var(--btn-primary-color)] transition hover:bg-[var(--btn-primary-bg-hover)]"
              >
                Open
                <ArrowRight size={16} />
              </NextLink>

              <ProjectActionLink href={boardHref}>
                <ClipboardList size={16} />
                Board
              </ProjectActionLink>

              <ProjectActionLink href={documentsHref}>
                <FileText size={16} />
                Docs
              </ProjectActionLink>
            </>
          ) : (
            <>
              <DisabledProjectAction className="flex-1">
                <LockKeyhole size={15} />
                Open
              </DisabledProjectAction>

              <DisabledProjectAction>
                <ClipboardList size={15} />
                Board
              </DisabledProjectAction>

              <DisabledProjectAction>
                <FileText size={15} />
                Docs
              </DisabledProjectAction>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function ProjectActionLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <NextLink
      href={href}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-hover)] hover:bg-[var(--secondary)]"
    >
      {children}
    </NextLink>
  );
}

function DisabledProjectAction({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        disabled
        className="peer inline-flex h-10 w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm font-semibold text-[var(--text-secondary)] opacity-70"
      >
        {children}
      </button>

      <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-max max-w-[220px] -translate-x-1/2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] shadow-xl peer-hover:block">
        You are not a project member
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3 transition group-hover:border-[var(--border-hover)]">
      <p className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
        {value}
      </p>
      <p className="mt-1 truncate text-xs font-medium text-[var(--text-secondary)]">
        {label}
      </p>
    </div>
  );
}
