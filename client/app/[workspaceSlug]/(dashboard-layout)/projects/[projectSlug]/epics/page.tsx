"use client";

import { Epic } from "@/features/tasks/types";
import useGetProjectEpics from "@/features/projects/hooks/useGetProjectEpics";
import useSlugs from "@/shared/hooks/useSlugs";
import SearchBar from "@/shared/ui/SearchBar";
import Select from "@/shared/ui/Select";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Layers3,
  Plus,
  RotateCcw,
  SortAsc,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import CreateEpicModal from "./components/CreateEpicModal";

type EpicStatus = "Planned" | "In_Progress" | "Done";
type SortMode = "position" | "dueDate" | "title" | "status";
type StatusFilter = "All" | EpicStatus;

const cardClass =
  "rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] shadow-sm";
const skeletonClass = "animate-pulse rounded-md bg-[var(--border)]";

const statusConfig: Record<
  EpicStatus,
  {
    label: string;
    className: string;
  }
> = {
  Planned: {
    label: "Planned",
    className: "bg-[var(--task-status-backlog-bg)] text-[var(--task-status-backlog-text)]",
  },
  In_Progress: {
    label: "In progress",
    className:
      "bg-[var(--task-status-in-progress-bg)] text-[var(--task-status-in-progress-text)]",
  },
  Done: {
    label: "Done",
    className: "bg-[var(--task-status-done-bg)] text-[var(--task-status-done-text)]",
  },
};

const statusOptions: StatusFilter[] = [
  "All",
  "Planned",
  "In_Progress",
  "Done",
];

const sortOptions: { label: string; value: SortMode }[] = [
  { label: "Position", value: "position" },
  { label: "Due date", value: "dueDate" },
  { label: "Title", value: "title" },
  { label: "Status", value: "status" },
];

export default function ProjectEpicsPage() {
  const slugs = useSlugs();
  const queryClient = useQueryClient();
  const workspaceSlug = slugs.workspace.slug;
  const projectSlug = slugs.project.slug;
  const projectBaseUrl = `/${workspaceSlug}/projects/${projectSlug}`;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [sortMode, setSortMode] = useState<SortMode>("position");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    data: apiEpics,
    isLoading,
    error,
  } = useGetProjectEpics(workspaceSlug, projectSlug);

  const epics = useMemo(
    () =>
      (apiEpics ?? []).map((epic) => ({
        ...epic,
        status: getEpicStatus(epic),
        descriptionText: getEpicDescription(epic),
      })),
    [apiEpics]
  );

  const filteredEpics = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return epics
      .filter((epic) => {
        const matchesSearch =
          !keyword ||
          epic.title.toLowerCase().includes(keyword) ||
          epic.descriptionText.toLowerCase().includes(keyword);

        const matchesStatus =
          statusFilter === "All" || epic.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortMode === "title") return a.title.localeCompare(b.title);
        if (sortMode === "status") return a.status.localeCompare(b.status);
        if (sortMode === "dueDate") {
          return getDateTime(a.dueDate) - getDateTime(b.dueDate);
        }

        return a.position - b.position;
      });
  }, [epics, search, statusFilter, sortMode]);

  const stats = useMemo(() => {
    return {
      total: epics.length,
      planned: epics.filter((epic) => epic.status === "Planned").length,
      inProgress: epics.filter((epic) => epic.status === "In_Progress").length,
      done: epics.filter((epic) => epic.status === "Done").length,
    };
  }, [epics]);

  const hasActiveFilters = search.trim() || statusFilter !== "All";

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
  };

  const refetchEpics = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["get-project-epics", workspaceSlug, projectSlug],
    });
  };

  if (isLoading) {
    return <EpicsSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-bg)] p-5 text-sm text-[var(--danger-text)]">
        Failed to load epics.
      </div>
    );
  }

  return (
    <div className="space-y-5 bg-[var(--background)] p-6">
      <section className={`${cardClass} p-6`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Layers3 size={16} />
              <span>{projectSlug}</span>
            </div>

            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Epics
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Group related tasks into larger initiatives, then open the board
              with one click to focus the work for that epic.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--on-primary)] shadow-xs transition hover:brightness-95"
          >
            <Plus size={16} />
            Create epic
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard icon={Layers3} label="Total epics" value={stats.total} />
          <SummaryCard icon={Clock} label="Planned" value={stats.planned} />
          <SummaryCard
            icon={CalendarDays}
            label="In progress"
            value={stats.inProgress}
          />
          <SummaryCard icon={CheckCircle2} label="Completed" value={stats.done} />
        </div>
      </section>

      <section className={`${cardClass} overflow-hidden`}>
        <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 xl:flex-row xl:items-center xl:justify-between">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search epics..."
            className="max-w-md"
          />

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-[var(--border)] bg-[var(--background)] p-1">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`h-8 rounded-lg px-3 text-xs font-medium transition ${
                    statusFilter === status
                      ? "bg-[var(--primary)] text-[var(--on-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {status === "All" ? "All" : statusConfig[status].label}
                </button>
              ))}
            </div>

            <div className="flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--text-secondary)]">
              <SortAsc size={15} />
              <Select
                items={sortOptions}
                selectedValue={sortMode}
                onItemClicked={(value) => {
                  if (value) setSortMode(value as SortMode);
                }}
                className="w-36"
                placeholder="Sort"
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]"
              >
                <RotateCcw size={15} />
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {filteredEpics.length > 0 ? (
            filteredEpics.map((epic) => (
              <EpicCard
                key={epic.id}
                epic={epic}
                boardHref={`${projectBaseUrl}/board?epic=${epic.id}`}
              />
            ))
          ) : (
            <EmptyState
              hasEpics={epics.length > 0}
              hasFilters={Boolean(hasActiveFilters)}
              onCreate={() => setIsCreateOpen(true)}
              onReset={resetFilters}
            />
          )}
        </div>
      </section>

      {isCreateOpen && (
        <CreateEpicModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={async () => {
            await refetchEpics();
            setSearch("");
            setStatusFilter("All");
            setSortMode("position");
            setIsCreateOpen(false);
          }}
        />
      )}
    </div>
  );
}

function EpicCard({
  epic,
  boardHref,
}: {
  epic: Epic & { status: EpicStatus; descriptionText: string };
  boardHref: string;
}) {
  return (
    <article className="group p-5 transition hover:bg-[var(--secondary)]/45">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: epic.color ?? "var(--primary)" }}
            />

            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                statusConfig[epic.status].className
              }`}
            >
              {statusConfig[epic.status].label}
            </span>

            <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
              #{epic.position}
            </span>
          </div>

          <h2 className="line-clamp-1 font-semibold text-[var(--text-primary)]">
            {epic.title}
          </h2>

          <p className="mt-1 line-clamp-2 text-sm text-[var(--text-secondary)]">
            {epic.descriptionText || "No description yet."}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)]">
            {epic.startDate && (
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} />
                Starts {formatDate(epic.startDate)}
              </span>
            )}

            {epic.dueDate && (
              <span className="flex items-center gap-1.5">
                <Clock size={14} />
                Due {formatDate(epic.dueDate)}
              </span>
            )}

            {!epic.startDate && !epic.dueDate && (
              <span>No schedule set</span>
            )}
          </div>
        </div>

        <Link
          href={boardHref}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm font-medium text-[var(--text-primary)] shadow-xs transition hover:bg-[var(--secondary)]"
        >
          View tasks
          <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Layers3;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--text-secondary)]">
        <Icon size={18} />
      </div>

      <p className="text-2xl font-semibold text-[var(--text-primary)]">
        {value}
      </p>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">{label}</p>
    </div>
  );
}

function EmptyState({
  hasEpics,
  hasFilters,
  onCreate,
  onReset,
}: {
  hasEpics: boolean;
  hasFilters: boolean;
  onCreate: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--text-secondary)]">
        <Layers3 size={22} />
      </div>

      <h3 className="font-semibold text-[var(--text-primary)]">
        {hasEpics ? "No epics match your filters" : "No epics yet"}
      </h3>

      <p className="mt-1 max-w-sm text-sm text-[var(--text-secondary)]">
        {hasEpics
          ? "Reset filters or search for a different initiative."
          : "Create an epic to group related tasks into a larger initiative."}
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {hasFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text-primary)] shadow-xs transition hover:bg-[var(--secondary)]"
          >
            <RotateCcw size={15} />
            Reset filters
          </button>
        )}

        {!hasEpics && (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--on-primary)] shadow-xs transition hover:brightness-95"
          >
            <Plus size={15} />
            Create epic
          </button>
        )}
      </div>
    </div>
  );
}

function EpicsSkeleton() {
  return (
    <div className="space-y-5 bg-[var(--background)] p-6">
      <section className={`${cardClass} p-6`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className={`mb-4 h-4 w-32 ${skeletonClass}`} />
            <div className={`h-8 w-44 ${skeletonClass}`} />
            <div className={`mt-3 h-4 w-full max-w-2xl ${skeletonClass}`} />
          </div>
          <div className={`h-10 w-32 rounded-xl ${skeletonClass}`} />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-[var(--border)] p-4">
              <div className={`mb-4 h-10 w-10 rounded-xl ${skeletonClass}`} />
              <div className={`h-7 w-12 ${skeletonClass}`} />
              <div className={`mt-2 h-4 w-24 ${skeletonClass}`} />
            </div>
          ))}
        </div>
      </section>

      <section className={`${cardClass} overflow-hidden`}>
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-4">
          <div className={`h-10 w-full max-w-md rounded-xl ${skeletonClass}`} />
          <div className={`hidden h-10 w-60 rounded-xl md:block ${skeletonClass}`} />
        </div>

        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="border-b border-[var(--border)] p-5 last:border-b-0">
            <div className={`mb-3 h-5 w-56 ${skeletonClass}`} />
            <div className={`h-4 w-full max-w-lg ${skeletonClass}`} />
            <div className={`mt-4 h-4 w-64 ${skeletonClass}`} />
          </div>
        ))}
      </section>
    </div>
  );
}

function getEpicStatus(epic: Epic): EpicStatus {
  if (epic.dueDate && new Date(epic.dueDate).getTime() < Date.now()) {
    return "Done";
  }

  if (epic.startDate && new Date(epic.startDate).getTime() <= Date.now()) {
    return "In_Progress";
  }

  return "Planned";
}

function getEpicDescription(epic: Epic) {
  const description = epic.description as unknown;

  if (!description) return "";
  if (typeof description === "string") return description;
  if (
    typeof description === "object" &&
    "plainText" in description &&
    typeof description.plainText === "string"
  ) {
    return description.plainText;
  }

  return "";
}

function getDateTime(value: Date | string | null) {
  if (!value) return Number.MAX_SAFE_INTEGER;

  return new Date(value).getTime();
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
