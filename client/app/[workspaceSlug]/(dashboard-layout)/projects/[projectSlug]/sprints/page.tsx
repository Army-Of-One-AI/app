/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { apiClient } from "@/shared/api/apiClient";
import useSlugs from "@/shared/hooks/useSlugs";
import { classNames } from "@/shared/styles/classNames";
import Button from "@/shared/ui/Button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DateTime } from "luxon";
import {
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Flag,
  Play,
  Plus,
  RotateCcw,
  Target,
  Trash2,
  ArrowRight,
  X,
} from "lucide-react";
import { ElementType, ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type SprintStatus = "Planned" | "Active" | "Completed" | "Canceled";
type SprintFilter = SprintStatus | "All";

type Sprint = {
  id: string;
  name: string;
  goal: string | null;
  status: SprintStatus;
  startDate: string;
  endDate: string;
  completedAt: string | null;
  projectId: string;
  totalTasks: number;
  doneTasks: number;
  progress: number;
  createdAt: string;
  updatedAt: string | null;
};

type CreateSprintPayload = {
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
};

const inputClass =
  "h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10";

export default function SprintsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get("action");
  const queryClient = useQueryClient();
  const slugs = useSlugs();

  const workspaceSlug = slugs.workspace.slug;
  const projectSlug = slugs.project.slug;
  const baseUrl = `/${workspaceSlug}/projects/${projectSlug}/sprints`;

  const [isCreating, setIsCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SprintFilter>("All");

  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["project-sprints", workspaceSlug, projectSlug],
    queryFn: async () => {
      const res = await apiClient.get<Sprint[]>(
        `/workspaces/${workspaceSlug}/projects/${projectSlug}/sprints`
      );

      return res.data;
    },
    enabled: !!workspaceSlug && !!projectSlug,
  });

  const viewSprintTasks = (sprintId: string) => {
    router.push(
      `/${workspaceSlug}/projects/${projectSlug}/board?sprint=${sprintId}`
    );
  };

  const openCreateModal = () => {
    setIsCreating(true);
    router.push(`${baseUrl}?action=create`, { scroll: false });
  };

  const closeCreateModal = () => {
    setIsCreating(false);
    router.replace(baseUrl, { scroll: false });
  };

  const invalidateSprints = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["project-sprints", workspaceSlug, projectSlug],
    });
  };

  const createSprintMutation = useMutation({
    mutationFn: async (payload: CreateSprintPayload) => {
      const res = await apiClient.post(
        `/workspaces/${workspaceSlug}/projects/${projectSlug}/sprints`,
        payload
      );

      return res.data;
    },
    onSuccess: async () => {
      closeCreateModal();
      await invalidateSprints();
    },
  });

  const startSprintMutation = useMutation({
    mutationFn: async (sprintId: string) => {
      const res = await apiClient.post(
        `/workspaces/${workspaceSlug}/projects/${projectSlug}/sprints/${sprintId}/start`
      );

      return res.data;
    },
    onSuccess: invalidateSprints,
  });

  const completeSprintMutation = useMutation({
    mutationFn: async (sprintId: string) => {
      const res = await apiClient.post(
        `/workspaces/${workspaceSlug}/projects/${projectSlug}/sprints/${sprintId}/complete`
      );

      return res.data;
    },
    onSuccess: invalidateSprints,
  });

  const cancelSprintMutation = useMutation({
    mutationFn: async (sprintId: string) => {
      const res = await apiClient.post(
        `/workspaces/${workspaceSlug}/projects/${projectSlug}/sprints/${sprintId}/cancel`
      );

      return res.data;
    },
    onSuccess: invalidateSprints,
  });

  const deleteSprintMutation = useMutation({
    mutationFn: async (sprintId: string) => {
      const res = await apiClient.delete(
        `/workspaces/${workspaceSlug}/projects/${projectSlug}/sprints/${sprintId}`
      );

      return res.data;
    },
    onSuccess: invalidateSprints,
  });

  const grouped = useMemo(() => {
    return {
      active: data.filter((sprint) => sprint.status === "Active"),
      planned: data.filter((sprint) => sprint.status === "Planned"),
      completed: data.filter((sprint) => sprint.status === "Completed"),
      canceled: data.filter((sprint) => sprint.status === "Canceled"),
    };
  }, [data]);

  const filteredSprints = useMemo(() => {
    if (statusFilter === "All") return data;

    return data.filter((sprint) => sprint.status === statusFilter);
  }, [data, statusFilter]);

  const stats = useMemo(() => {
    const totalTasks = data.reduce((sum, sprint) => sum + sprint.totalTasks, 0);
    const doneTasks = data.reduce((sum, sprint) => sum + sprint.doneTasks, 0);
    const overallProgress =
      totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

    return [
      {
        label: "Total sprints",
        value: data.length,
        helper: "All planning cycles",
        icon: Flag,
      },
      {
        label: "Active",
        value: grouped.active.length,
        helper: "Currently running",
        icon: CircleDot,
      },
      {
        label: "Completed",
        value: grouped.completed.length,
        helper: "Finished cycles",
        icon: CheckCircle2,
      },
      {
        label: "Progress",
        value: `${overallProgress}%`,
        helper: `${doneTasks}/${totalTasks} tasks done`,
        icon: Target,
      },
    ];
  }, [data, grouped.active.length, grouped.completed.length]);

  const activeSprint = grouped.active[0];

  useEffect(() => {
    setIsCreating(action === "create");
  }, [action]);

  return (
    <div className="min-h-full bg-[var(--background)] p-6 text-[var(--text-primary)]">
      <div className="mb-6 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
        <div className="relative p-6">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[var(--primary)]/5 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                Sprints
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                Plan focused delivery cycles, start the current sprint, and
                track how much committed work has been completed.
              </p>
            </div>

            <Button
              type="button"
              className="w-38 flex items-center justify-center gap-2"
              onClick={openCreateModal}
            >
              <Plus size={16} />
              Create sprint
            </Button>
          </div>

          <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <SprintStatCard key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </div>

      {activeSprint && (
        <ActiveSprintHero
          sprint={activeSprint}
          onComplete={(id) => completeSprintMutation.mutate(id)}
          onCancel={(id) => cancelSprintMutation.mutate(id)}
        />
      )}

      {isCreating && (
        <CreateSprintModal
          isLoading={createSprintMutation.isPending}
          onCancel={closeCreateModal}
          onCreate={(payload) => createSprintMutation.mutate(payload)}
        />
      )}

      {error ? (
        <div
          className={`rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-bg)] p-5 text-sm ${classNames.danger.text}`}
        >
          Failed to load sprints. Refresh the page or try again later.
        </div>
      ) : isLoading ? (
        <SprintTableSkeleton />
      ) : data.length === 0 ? (
        <EmptySprintsState onCreate={openCreateModal} />
      ) : (
        <SprintsTablePanel
          sprints={filteredSprints}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
          counts={{
            All: data.length,
            Active: grouped.active.length,
            Planned: grouped.planned.length,
            Completed: grouped.completed.length,
            Canceled: grouped.canceled.length,
          }}
          activeSprintId={activeSprint?.id ?? null}
          onStart={(id) => {
            if (activeSprint && activeSprint.id !== id) return;

            startSprintMutation.mutate(id);
          }}
          onCancel={(id) => cancelSprintMutation.mutate(id)}
          onDelete={(id) => deleteSprintMutation.mutate(id)}
          onViewTasks={viewSprintTasks}
        />
      )}
    </div>
  );
}

function CreateSprintModal({
  isLoading,
  onCreate,
  onCancel,
}: {
  isLoading: boolean;
  onCreate: (payload: CreateSprintPayload) => void;
  onCancel: () => void;
}) {
  const today = DateTime.now().toISODate() ?? "";
  const defaultEndDate = DateTime.now().plus({ days: 14 }).toISODate() ?? "";

  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(defaultEndDate);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();

          if (!name.trim()) return;

          onCreate({
            name: name.trim(),
            goal: goal.trim() || undefined,
            startDate,
            endDate,
          });
        }}
        className="w-full max-w-2xl overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Create sprint
            </h2>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Set a clear goal and a time window for the next delivery cycle.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl p-2 text-[var(--text-secondary)] transition hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 p-6 lg:grid-cols-2">
          <Field label="Sprint name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sprint 1"
              className={inputClass}
              autoFocus
            />
          </Field>

          <Field label="Sprint goal">
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Finish authentication MVP"
              className={inputClass}
            />
          </Field>

          <Field label="Start date">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="End date">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] bg-[var(--background)]/40 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--secondary)]"
          >
            Cancel
          </button>

          <Button type="submit" disabled={isLoading || !name.trim()}>
            {isLoading ? "Creating..." : "Create sprint"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function SprintsTablePanel({
  sprints,
  activeFilter,
  counts,
  onFilterChange,
  activeSprintId,
  onStart,
  onCancel,
  onDelete,
  onViewTasks,
}: {
  sprints: Sprint[];
  activeFilter: SprintFilter;
  counts: Record<SprintFilter, number>;
  onFilterChange: (filter: SprintFilter) => void;
  activeSprintId: string | null;
  onStart: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onViewTasks: (id: string) => void;
}) {
  const filters: SprintFilter[] = [
    "All",
    "Active",
    "Planned",
    "Completed",
    "Canceled",
  ];

  return (
    <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
      <div className="border-b border-[var(--border)] px-5 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">
              Sprint list
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              View, filter, and manage all sprint cycles in one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => {
              const isActive = activeFilter === filter;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => onFilterChange(filter)}
                  className={[
                    "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition",
                    isActive
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]",
                  ].join(" ")}
                >
                  {filter}

                  <span
                    className={[
                      "rounded-full px-1.5 py-0.5 text-xs",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[var(--secondary)] text-[var(--text-secondary)]",
                    ].join(" ")}
                  >
                    {counts[filter]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {sprints.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-[var(--text-secondary)]">
          No sprints found for this filter.
        </div>
      ) : (
        <SprintTable
          sprints={sprints}
          activeSprintId={activeSprintId}
          onStart={onStart}
          onCancel={onCancel}
          onDelete={onDelete}
          onViewTasks={onViewTasks}
        />
      )}
    </section>
  );
}

function SprintTable({
  sprints,
  activeSprintId,
  onStart,
  onCancel,
  onDelete,
  onViewTasks,
}: {
  sprints: Sprint[];
  activeSprintId: string | null;
  onStart: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onViewTasks: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--background)]/40 text-left">
            <TableHead>Sprint</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Tasks</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </tr>
        </thead>

        <tbody>
          {sprints.map((sprint) => (
            <SprintRow
              key={sprint.id}
              sprint={sprint}
              activeSprintId={activeSprintId}
              onStart={onStart}
              onCancel={onCancel}
              onDelete={onDelete}
              onViewTasks={onViewTasks}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SprintRow({
  sprint,
  activeSprintId,
  onStart,
  onCancel,
  onDelete,
  onViewTasks,
}: {
  sprint: Sprint;
  activeSprintId: string | null;
  onStart: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onViewTasks: (id: string) => void;
}) {
  const cannotStartBecauseAnotherSprintIsActive =
    sprint.status === "Planned" &&
    activeSprintId !== null &&
    activeSprintId !== sprint.id;

  return (
    <tr className="group border-b border-[var(--border)] last:border-b-0 transition hover:bg-[var(--secondary)]/40">
      <td className="max-w-[360px] px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)]">
            <Flag size={15} />
          </div>

          <div className="min-w-0">
            <h3 className="line-clamp-1 text-sm font-semibold text-[var(--text-primary)]">
              {sprint.name}
            </h3>

            <p className="mt-1 line-clamp-1 text-sm text-[var(--text-secondary)]">
              {sprint.goal || "No sprint goal yet."}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <SprintStatusBadge status={sprint.status} />
      </td>

      <td className="min-w-56 px-5 py-4">
        <SprintProgress sprint={sprint} compact />
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <CalendarDays size={14} />
          <div>
            <p>{formatDate(sprint.startDate)}</p>
            <p className="mt-0.5">{formatDate(sprint.endDate)}</p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {sprint.doneTasks}/{sprint.totalTasks}
        </p>
        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
          tasks done
        </p>
      </td>

      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">
          {sprint.status === "Planned" && (
            <IconActionButton
              disabled={cannotStartBecauseAnotherSprintIsActive}
              label={
                cannotStartBecauseAnotherSprintIsActive
                  ? "Finish or cancel the active sprint before starting another"
                  : "Start sprint"
              }
              onClick={() => onStart(sprint.id)}
            >
              <Play size={14} />
            </IconActionButton>
          )}

          {(sprint.status === "Planned" || sprint.status === "Active") && (
            <IconActionButton
              label="Cancel sprint"
              onClick={() => onCancel(sprint.id)}
            >
              <RotateCcw size={14} />
            </IconActionButton>
          )}

          <IconActionButton
            label="View tasks"
            onClick={() => onViewTasks(sprint.id)}
          >
            <ArrowRight size={14} />
          </IconActionButton>

          <IconActionButton
            danger
            label="Delete sprint"
            onClick={() => onDelete(sprint.id)}
          >
            <Trash2 size={14} />
          </IconActionButton>
        </div>
      </td>
    </tr>
  );
}

function ActiveSprintHero({
  sprint,
  onComplete,
  onCancel,
}: {
  sprint: Sprint;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  return (
    <section className="mb-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <SprintStatusBadge status="Active" />

            <span className="text-xs text-[var(--text-secondary)]">
              {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
            </span>
          </div>

          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            {sprint.name}
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            {sprint.goal || "No sprint goal yet."}
          </p>
        </div>

        <div className="min-w-[17.5rem]">
          <SprintProgress sprint={sprint} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ActionButton onClick={() => onComplete(sprint.id)}>
            <CheckCircle2 size={14} />
            Complete
          </ActionButton>

          <ActionButton onClick={() => onCancel(sprint.id)}>
            <RotateCcw size={14} />
            Cancel
          </ActionButton>
        </div>
      </div>
    </section>
  );
}

function CreateSprintPanel({
  isLoading,
  onCreate,
  onCancel,
}: {
  isLoading: boolean;
  onCreate: (payload: CreateSprintPayload) => void;
  onCancel: () => void;
}) {
  const today = DateTime.now().toISODate() ?? "";
  const defaultEndDate = DateTime.now().plus({ days: 14 }).toISODate() ?? "";

  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(defaultEndDate);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        if (!name.trim()) return;

        onCreate({
          name: name.trim(),
          goal: goal.trim() || undefined,
          startDate,
          endDate,
        });
      }}
      className="mb-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Create sprint
          </h2>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Set a clear goal and a time window for the next delivery cycle.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl p-2 text-[var(--text-secondary)] transition hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]"
        >
          <X size={18} />
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Sprint name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sprint 1"
            className={inputClass}
          />
        </Field>

        <Field label="Sprint goal">
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Finish authentication MVP"
            className={inputClass}
          />
        </Field>

        <Field label="Start date">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="End date">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--secondary)]"
        >
          Cancel
        </button>

        <Button type="submit" disabled={isLoading || !name.trim()}>
          {isLoading ? "Creating..." : "Create sprint"}
        </Button>
      </div>
    </form>
  );
}

function SprintProgress({
  sprint,
  compact = false,
}: {
  sprint: Sprint;
  compact?: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-[var(--text-secondary)]">
          {compact
            ? `${sprint.progress}% complete`
            : `${sprint.doneTasks}/${sprint.totalTasks} tasks completed`}
        </span>

        {!compact && (
          <span className="font-semibold text-[var(--text-primary)]">
            {sprint.progress}%
          </span>
        )}
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[var(--secondary)]">
        <div
          className="h-full rounded-full bg-[var(--primary)] transition-all"
          style={{ width: `${sprint.progress}%` }}
        />
      </div>
    </div>
  );
}

function SprintStatusBadge({ status }: { status: SprintStatus }) {
  const className =
    status === "Active"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
      : status === "Completed"
      ? "border-blue-500/20 bg-blue-500/10 text-blue-500"
      : status === "Canceled"
      ? "border-red-500/20 bg-red-500/10 text-red-500"
      : "border-[var(--border)] bg-[var(--secondary)] text-[var(--text-secondary)]";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      <CircleDot size={10} />
      {status}
    </span>
  );
}

function SprintStatCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  helper: string;
  icon: ElementType;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
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

function EmptySprintsState({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="flex min-h-100 items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-soft)]">
      <div className="max-w-sm flex w-full flex-col items-center justify-center gap-2">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--text-primary)]">
          <Flag size={22} />
        </div>

        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          No sprints yet
        </h2>

        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Create your first sprint to plan a focused, time-boxed delivery cycle.
        </p>

        <Button
          type="button"
          onClick={onCreate}
          className="mt-5 w-38 flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Create sprint
        </Button>
      </div>
    </section>
  );
}

function SprintTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
      <div className="border-b border-[var(--border)] px-5 py-4">
        <div className="h-4 w-32 animate-pulse rounded-full bg-[var(--secondary)]" />
        <div className="mt-2 h-3 w-56 animate-pulse rounded-full bg-[var(--secondary)]" />
      </div>

      <div className="divide-y divide-[var(--border)]">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr] gap-4 px-5 py-4"
          >
            {Array.from({ length: 5 }).map((__, itemIndex) => (
              <div
                key={itemIndex}
                className="h-4 animate-pulse rounded-full bg-[var(--secondary)]"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TableHead({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-5 py-3 text-xs font-medium text-[var(--text-secondary)] ${className}`}
    >
      {children}
    </th>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
        {label}
      </span>

      {children}
    </label>
  );
}

function ActionButton({
  children,
  onClick,
  danger = false,
}: {
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition",
        danger
          ? "border-red-500/20 text-red-500 hover:bg-red-500/10"
          : "border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--secondary)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function IconActionButton({
  children,
  onClick,
  label,
  danger = false,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        onClick();
      }}
      className={[
        "inline-flex size-9 items-center justify-center rounded-xl border text-sm font-medium transition",
        disabled
          ? "cursor-not-allowed border-[var(--border)] text-[var(--text-secondary)] opacity-45"
          : danger
          ? "border-red-500/20 text-red-500 hover:bg-red-500/10"
          : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function formatDate(value: string) {
  return DateTime.fromISO(value).toFormat("dd LLL yyyy");
}
