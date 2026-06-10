"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import {
  CalendarDays,
  CircleDot,
  ClipboardList,
  FolderKanban,
  Plus,
  UsersRound,
} from "lucide-react";

import { apiClient } from "@/shared/api/apiClient";
import useDebounce from "@/shared/hooks/useDebounce";
import useModal from "@/shared/hooks/useModal";
import useSlugs from "@/shared/hooks/useSlugs";
import { ProjectStatus } from "@/shared/types/enums";
import PageContent from "@/shared/ui/DashboardLayout/PageContent";
import SearchBar from "@/shared/ui/SearchBar";
import {
  CreateProjectPayload,
  FindProjectsResponse,
} from "@/features/projects/types";
import CreateProjectModal from "./components/CreateProjectModal";
import FilterPill from "./components/FilterPill";
import useAuthentication from "@/features/auth/hooks/useAuthentication";
import { formatStatus } from "@/shared/utils/helpers";
import ProjectsSkeleton from "./components/ProjectSkeleton";
import EmptyState from "./components/EmptyState";
import StatCard from "./components/StatCard";
import { ProjectCard } from "./components/ProjectCard";
import useCurrentUserWorkspacePermissions from "@/features/auth/hooks/useCurrentUserWorkspacePermissions";

const LIMIT = 20;

export default function ProjectsPage() {
  const { workspace } = useSlugs();
  const workspaceSlug = workspace.slug;

  const queryClient = useQueryClient();
  const { openModal, closeModal } = useModal();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [status, setStatus] = useState<ProjectStatus | "">("");

  const { userInfo: currentUser } = useAuthentication();
  const { data: currentUserWorkspacePermissions } =
    useCurrentUserWorkspacePermissions(workspaceSlug);
  const canCreateProject =
    currentUserWorkspacePermissions?.workspacePermissions.project.canCreate ??
    false;

  const { data, isLoading, error } = useQuery({
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

            {canCreateProject && (
              <button
                type="button"
                onClick={openCreateProjectModal}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--btn-primary-bg)] px-4 text-sm font-medium text-[var(--btn-primary-color)] shadow-xs transition hover:bg-[var(--btn-primary-bg-hover)]"
              >
                <Plus size={16} />
                Create project
              </button>
            )}
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
                currentUserId={currentUser?.id}
              />
            ))}
          </section>
        ) : (
          <EmptyState
            hasActiveFilters={hasActiveFilters}
            canCreateProject={canCreateProject}
            onCreate={openCreateProjectModal}
            onResetFilters={resetFilters}
          />
        )}
      </div>
    </PageContent>
  );
}
