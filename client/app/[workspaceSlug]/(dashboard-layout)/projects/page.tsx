"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ElementType } from "react";
import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import { useMediaQuery } from "usehooks-ts";
import {
  ArrowRight,
  CalendarDays,
  CircleDot,
  ClipboardList,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Plus,
  SearchX,
  UsersRound,
} from "lucide-react";

import { apiClient } from "@/shared/api/apiClient";
import useDebounce from "@/shared/hooks/useDebounce";
import useModal from "@/shared/hooks/useModal";
import useSlugs from "@/shared/hooks/useSlugs";
import { projectStatusColors } from "@/shared/styles/classNames";
import { ProjectStatus } from "@/shared/types/enums";
import PageContent from "@/shared/ui/DashboardLayout/PageContent";
import Drawer, { DrawerDirection } from "@/shared/ui/Drawer";
import SearchBar from "@/shared/ui/SearchBar";
import {
  CreateProjectPayload,
  FindProjectsResponse,
  Project,
} from "@/features/projects/types";
import CreateProjectModal from "./components/CreateProjectModal";
import FilterPill from "./components/FilterPill";
import ProjectOverview from "./components/ProjectOverview";

const LIMIT = 20;
const skeletonClass = "animate-pulse rounded-md bg-[var(--border)]";

export default function ProjectsPage() {
  const matches = useMediaQuery("(min-width: 768px)");
  const { workspace } = useSlugs();
  const workspaceSlug = workspace.slug;

  const queryClient = useQueryClient();
  const { openModal, closeModal } = useModal();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [status, setStatus] = useState<ProjectStatus | "">("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["workspace-projects", workspaceSlug, debouncedSearch, status],
    queryFn: async () => {
      const res = await apiClient.get<FindProjectsResponse>(
        `/workspaces/${workspaceSlug}/projects`,
        {
          params: {
            page: 1,
            limit: LIMIT,
            ...(debouncedSearch.trim() && { name: debouncedSearch.trim() }),
            ...(status && { status }),
          },
        }
      );

      return res.data;
    },
    enabled: Boolean(workspaceSlug),
  });

  const createProjectMutation = useMutation({
    mutationFn: async (payload: CreateProjectPayload) => {
      const res = await apiClient.post(
        `/workspaces/${workspaceSlug}/projects`,
        payload
      );

      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["workspace-projects", workspaceSlug],
      });

      closeModal();
    },
  });

  const openCreateProjectModal = () => {
    openModal({
      title: "Create project",
      modalContent: (
        <CreateProjectModal
          isLoading={createProjectMutation.isPending}
          onCreate={(payload) => createProjectMutation.mutate(payload)}
        />
      ),
    });
  };

  const projects = useMemo(() => data?.items ?? [], [data?.items]);
  const selectedProject = projects.find(
    (project) => project.id === selectedProjectId
  );
  const hasActiveFilters = Boolean(search.trim() || status);

  const stats = useMemo(() => {
    const totalTasks = projects.reduce(
      (sum, project) => sum + project.taskCount,
      0
    );
    const totalMembers = projects.reduce(
      (sum, project) => sum + project.members.length,
      0
    );
    const activeProjects = projects.filter(
      (project) => project.status === ProjectStatus.Active
    ).length;
    const dueSoon = projects.filter((project) => {
      if (!project.targetDate) return false;

      const targetDate = DateTime.fromISO(project.targetDate);
      return (
        targetDate >= DateTime.now().startOf("day") &&
        targetDate <= DateTime.now().plus({ days: 14 })
      );
    }).length;

    return [
      {
        label: "Projects",
        value: data?.pagination.total ?? projects.length,
        helper: "Matching this view",
        icon: FolderKanban,
      },
      {
        label: "Active",
        value: activeProjects,
        helper: "Currently moving",
        icon: CircleDot,
      },
      {
        label: "Tasks",
        value: totalTasks,
        helper: "Across visible projects",
        icon: ClipboardList,
      },
      {
        label: "Due soon",
        value: dueSoon,
        helper: "Next 14 days",
        icon: CalendarDays,
      },
      {
        label: "Members",
        value: totalMembers,
        helper: "Visible assignments",
        icon: UsersRound,
      },
    ];
  }, [data?.pagination.total, projects]);

  const resetFilters = () => {
    setSearch("");
    setStatus("");
  };

  return (
    <PageContent
      title="Projects"
      customHeader={
        <div className="flex w-full flex-col gap-4 p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                <FolderKanban size={14} />
                Workspace projects
              </div>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                Projects
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                Track active work, jump into boards, and keep project context
                easy to scan.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateProjectModal}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--btn-primary-bg)] px-4 text-sm font-medium text-[var(--btn-primary-color)] shadow-xs transition hover:bg-[var(--btn-primary-bg-hover)]"
            >
              <Plus size={16} />
              Create project
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-soft)] lg:flex-row lg:items-center">
            <SearchBar
              value={search}
              onChange={setSearch}
              onClear={() => setSearch("")}
              placeholder="Search projects..."
              className="min-w-[240px] flex-1"
            />

            <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
              <FilterPill active={status === ""} onClick={() => setStatus("")}>
                All
              </FilterPill>

              {Object.values(ProjectStatus).map((value) => (
                <FilterPill
                  key={value}
                  active={status === value}
                  onClick={() => setStatus(value)}
                >
                  {formatStatus(value)}
                </FilterPill>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <div className="min-h-full bg-[var(--background)] px-6 py-5 text-[var(--text-primary)]">
        {error ? (
          <div className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-5 py-4 text-sm text-[var(--danger-text)]">
            Failed to load projects. Refresh the page or try again later.
          </div>
        ) : isLoading ? (
          <ProjectsSkeleton />
        ) : projects.length > 0 ? (
          <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                workspaceSlug={workspaceSlug}
                onInspect={() => setSelectedProjectId(project.id)}
              />
            ))}
          </section>
        ) : (
          <EmptyState
            hasActiveFilters={hasActiveFilters}
            onCreate={openCreateProjectModal}
            onResetFilters={resetFilters}
          />
        )}
      </div>

      <Drawer
        onClose={() => setSelectedProjectId(null)}
        isOpen={Boolean(selectedProjectId)}
        direction={matches ? DrawerDirection.Right : DrawerDirection.Bottom}
        className={`${!matches && "h-screen"}`}
      >
        <ProjectOverview project={selectedProject} />
      </Drawer>
    </PageContent>
  );
}

function ProjectCard({
  project,
  workspaceSlug,
  onInspect,
}: {
  project: Project;
  workspaceSlug: string;
  onInspect: () => void;
}) {
  const projectHref = `/${workspaceSlug}/projects/${project.slug}`;
  const boardHref = `${projectHref}/board`;
  const documentsHref = `${projectHref}/documents`;
  const owner = project.members[0];
  const description = project.description?.plainText?.trim();

  return (
    <article className="group flex min-h-[280px] flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--border-hover)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${projectStatusColors[project.status]}`}
            >
              {formatStatus(project.status)}
            </span>
            {project.targetDate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--secondary)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">
                <CalendarDays size={13} />
                {formatDate(project.targetDate)}
              </span>
            )}
          </div>

          <h2 className="truncate text-lg font-semibold text-[var(--text-primary)]">
            {project.name}
          </h2>
          <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
            /projects/{project.slug}
          </p>
        </div>

        <button
          type="button"
          onClick={onInspect}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] transition hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]"
          aria-label={`Inspect ${project.name}`}
        >
          <LayoutDashboard size={16} />
        </button>
      </div>

      <p className="mt-4 line-clamp-2 min-h-11 text-sm leading-6 text-[var(--text-secondary)]">
        {description || "No description yet. Open the project to add context and planning details."}
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <MiniStat label="Tasks" value={project.taskCount.toString()} />
        <MiniStat label="Members" value={project.members.length.toString()} />
        <MiniStat
          label="Created"
          value={DateTime.fromISO(project.createdAt).toFormat("dd LLL")}
        />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--text-secondary)]">
            Owner
          </p>
          {owner ? (
            <div className="mt-2 flex min-w-0 items-center gap-2">
              <MemberAvatar member={owner} />
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
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
        <Link
          href={projectHref}
          className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--btn-primary-bg)] px-3 text-sm font-medium text-[var(--btn-primary-color)] transition hover:bg-[var(--btn-primary-bg-hover)]"
        >
          Open
          <ArrowRight size={16} />
        </Link>

        <Link
          href={boardHref}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--secondary)]"
        >
          <ClipboardList size={16} />
          Board
        </Link>

        <Link
          href={documentsHref}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--secondary)]"
        >
          <FileText size={16} />
          Docs
        </Link>
      </div>
    </article>
  );
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: number;
  helper: string;
  icon: ElementType;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-[var(--text-secondary)]">
          {label}
        </p>
        <Icon size={16} className="text-[var(--text-secondary)]" />
      </div>
      <p className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">
        {value}
      </p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">{helper}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
      <p className="text-base font-semibold text-[var(--text-primary)]">
        {value}
      </p>
      <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
        {label}
      </p>
    </div>
  );
}

function MemberStack({ members }: { members: Project["members"] }) {
  const visibleMembers = members.slice(0, 4);
  const remainingCount = members.length - visibleMembers.length;

  return (
    <div className="flex items-center">
      {visibleMembers.map((member, index) => (
        <div
          key={member.id}
          className="-ml-2 first:ml-0"
          style={{ zIndex: visibleMembers.length - index }}
        >
          <MemberAvatar member={member} />
        </div>
      ))}

      {remainingCount > 0 && (
        <div className="-ml-2 flex size-8 items-center justify-center rounded-full border-2 border-[var(--surface)] bg-[var(--secondary)] text-[10px] font-semibold text-[var(--text-secondary)]">
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

function MemberAvatar({ member }: { member: Project["members"][number] }) {
  const name = member.fullName || member.username || member.email;

  if (member.avatarURL) {
    return (
      <div
        aria-label={name}
        className="size-8 rounded-full border-2 border-[var(--surface)] bg-cover bg-center"
        role="img"
        style={{
          backgroundImage: `url("${member.avatarURL}")`,
        }}
        title={name}
      />
    );
  }

  return (
    <div
      className="flex size-8 items-center justify-center rounded-full border-2 border-[var(--surface)] bg-[var(--secondary)] text-xs font-semibold text-[var(--text-secondary)]"
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}

function EmptyState({
  hasActiveFilters,
  onCreate,
  onResetFilters,
}: {
  hasActiveFilters: boolean;
  onCreate: () => void;
  onResetFilters: () => void;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-14 text-center shadow-[var(--shadow-soft)]">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--text-secondary)]">
        {hasActiveFilters ? <SearchX size={22} /> : <FolderKanban size={22} />}
      </div>
      <h2 className="mt-4 text-base font-semibold text-[var(--text-primary)]">
        {hasActiveFilters ? "No matching projects" : "No projects yet"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
        {hasActiveFilters
          ? "Clear the current filters or search for a different project name."
          : "Create your first project to start organizing tasks, documents, and delivery work."}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--secondary)]"
          >
            Reset filters
          </button>
        )}

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--btn-primary-bg)] px-4 text-sm font-medium text-[var(--btn-primary-color)] transition hover:bg-[var(--btn-primary-bg-hover)]"
        >
          <Plus size={16} />
          Create project
        </button>
      </div>
    </section>
  );
}

function ProjectsSkeleton() {
  return (
    <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className={`${skeletonClass} h-6 w-24 rounded-full`} />
              <div className={`${skeletonClass} h-5 w-2/3`} />
              <div className={`${skeletonClass} h-3 w-1/2`} />
            </div>
            <div className={`${skeletonClass} size-9 rounded-xl`} />
          </div>
          <div className={`${skeletonClass} mt-5 h-4 w-full`} />
          <div className={`${skeletonClass} mt-3 h-4 w-5/6`} />
          <div className="mt-5 grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((__, statIndex) => (
              <div
                key={statIndex}
                className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3"
              >
                <div className={`${skeletonClass} h-4 w-10`} />
                <div className={`${skeletonClass} mt-2 h-3 w-16`} />
              </div>
            ))}
          </div>
          <div className={`${skeletonClass} mt-6 h-10 w-full rounded-xl`} />
        </div>
      ))}
    </section>
  );
}

function formatStatus(value: ProjectStatus) {
  return value.split("_").join(" ");
}

function formatDate(value: string) {
  return DateTime.fromISO(value).toFormat("dd LLL yyyy");
}

function getInitials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return initials || "?";
}
