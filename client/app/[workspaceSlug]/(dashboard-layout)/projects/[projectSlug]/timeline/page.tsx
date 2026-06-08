"use client";

import { apiClient } from "@/shared/api/apiClient";
import useSlugs from "@/shared/hooks/useSlugs";
import { classNames } from "@/shared/styles/classNames";
import Button from "@/shared/ui/Button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DateTime } from "luxon";
import {
  ArrowRight,
  CalendarDays,
  CircleDot,
  Clock,
  Flag,
  GripVertical,
  LayoutGrid,
  ListTodo,
  Lock,
  Loader2,
  Plus,
  Target,
  TimerReset,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  CSSProperties,
  ElementType,
  MouseEvent as ReactMouseEvent,
  useMemo,
  useRef,
  useState,
} from "react";

type SprintStatus = "Planned" | "Active" | "Completed" | "Canceled";
type TimelineFilter = SprintStatus | "All";

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

const DAY_WIDTH = 48;
const LEFT_PANEL_WIDTH = 340;
const TIMELINE_GUTTER = 20;
const STATUS_ORDER: SprintStatus[] = [
  "Active",
  "Planned",
  "Completed",
  "Canceled",
];

const statusTone: Record<
  SprintStatus,
  {
    dot: string;
    badge: string;
    bar: string;
    rail: string;
  }
> = {
  Active: {
    dot: "bg-emerald-500",
    badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
    bar: "bg-emerald-500 text-white",
    rail: "bg-emerald-500/8",
  },
  Planned: {
    dot: "bg-sky-500",
    badge: "border-sky-500/20 bg-sky-500/10 text-sky-500",
    bar: "bg-sky-500 text-white",
    rail: "bg-sky-500/8",
  },
  Completed: {
    dot: "bg-violet-500",
    badge: "border-violet-500/20 bg-violet-500/10 text-violet-500",
    bar: "bg-violet-500 text-white",
    rail: "bg-violet-500/8",
  },
  Canceled: {
    dot: "bg-red-500",
    badge: "border-red-500/20 bg-red-500/10 text-red-500",
    bar: "bg-red-500 text-white",
    rail: "bg-red-500/8",
  },
};

export default function TimelinePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const slugs = useSlugs();

  const workspaceSlug = slugs.workspace.slug;
  const projectSlug = slugs.project.slug;

  const [activeFilter, setActiveFilter] = useState<TimelineFilter>("All");
  const [localDates, setLocalDates] = useState<
    Record<string, { startDate: string; endDate: string }>
  >({});

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

  const sprints = useMemo(() => {
    return data.map((sprint) => ({
      ...sprint,
      startDate: localDates[sprint.id]?.startDate ?? sprint.startDate,
      endDate: localDates[sprint.id]?.endDate ?? sprint.endDate,
    }));
  }, [data, localDates]);

  const updateSprintDatesMutation = useMutation({
    mutationFn: async ({
      sprintId,
      startDate,
      endDate,
    }: {
      sprintId: string;
      startDate: string;
      endDate: string;
    }) => {
      const res = await apiClient.patch(
        `/workspaces/${workspaceSlug}/projects/${projectSlug}/sprints/${sprintId}`,
        {
          startDate,
          endDate,
        }
      );

      return res.data;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["project-sprints", workspaceSlug, projectSlug],
      });

      setLocalDates((prev) => {
        const next = { ...prev };
        delete next[variables.sprintId];
        return next;
      });
    },
  });

  const filteredSprints = useMemo(() => {
    const sorted = [...sprints].sort(
      (a, b) =>
        DateTime.fromISO(a.startDate).toMillis() -
        DateTime.fromISO(b.startDate).toMillis()
    );

    if (activeFilter === "All") return sorted;

    return sorted.filter((sprint) => sprint.status === activeFilter);
  }, [activeFilter, sprints]);

  const timeline = useMemo(() => {
    if (!filteredSprints.length) return null;

    const minDate = filteredSprints
      .reduce((earliest, sprint) => {
        const start = DateTime.fromISO(sprint.startDate).startOf("day");
        return start < earliest ? start : earliest;
      }, DateTime.fromISO(filteredSprints[0].startDate).startOf("day"))
      .minus({ days: 3 })
      .startOf("week");

    const maxDate = filteredSprints
      .reduce((latest, sprint) => {
        const end = DateTime.fromISO(sprint.endDate).startOf("day");
        return end > latest ? end : latest;
      }, DateTime.fromISO(filteredSprints[0].endDate).startOf("day"))
      .plus({ days: 7 })
      .endOf("week");

    const totalDays = Math.max(
      1,
      Math.ceil(maxDate.diff(minDate, "days").days) + 1
    );

    const groups = STATUS_ORDER.map((status) => ({
      status,
      sprints: filteredSprints.filter((sprint) => sprint.status === status),
    })).filter((group) => group.sprints.length > 0);

    const today = DateTime.now().startOf("day");
    const todayOffsetDays = Math.floor(today.diff(minDate, "days").days);
    const todayLeft =
      todayOffsetDays >= 0 && todayOffsetDays < totalDays
        ? TIMELINE_GUTTER + todayOffsetDays * DAY_WIDTH + DAY_WIDTH / 2
        : null;

    return {
      minDate,
      totalDays,
      groups,
      todayLeft,
      totalWidth: totalDays * DAY_WIDTH + TIMELINE_GUTTER * 2,
    };
  }, [filteredSprints]);

  const stats = useMemo(() => {
    const totalTasks = sprints.reduce((sum, sprint) => sum + sprint.totalTasks, 0);
    const doneTasks = sprints.reduce((sum, sprint) => sum + sprint.doneTasks, 0);
    const overallProgress =
      totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
    const activeSprint = sprints.find((sprint) => sprint.status === "Active");
    const nextSprint = sprints
      .filter((sprint) => sprint.status === "Planned")
      .sort(
        (a, b) =>
          DateTime.fromISO(a.startDate).toMillis() -
          DateTime.fromISO(b.startDate).toMillis()
      )[0];

    return [
      {
        label: "Sprints",
        value: sprints.length,
        helper: "All cycles",
        icon: TimerReset,
      },
      {
        label: "Active",
        value: sprints.filter((sprint) => sprint.status === "Active").length,
        helper: activeSprint?.name ?? "None running",
        icon: CircleDot,
      },
      {
        label: "Progress",
        value: `${overallProgress}%`,
        helper: `${doneTasks}/${totalTasks} tasks done`,
        icon: Target,
      },
      {
        label: "Next",
        value: nextSprint ? formatCompactDate(nextSprint.startDate) : "-",
        helper: nextSprint?.name ?? "No planned sprint",
        icon: CalendarDays,
      },
    ];
  }, [sprints]);

  const filterCounts = useMemo(() => {
    return {
      All: sprints.length,
      Active: sprints.filter((sprint) => sprint.status === "Active").length,
      Planned: sprints.filter((sprint) => sprint.status === "Planned").length,
      Completed: sprints.filter((sprint) => sprint.status === "Completed").length,
      Canceled: sprints.filter((sprint) => sprint.status === "Canceled").length,
    } satisfies Record<TimelineFilter, number>;
  }, [sprints]);

  function openBoard(sprintId?: string) {
    router.push(
      `/${workspaceSlug}/projects/${projectSlug}/board${
        sprintId ? `?sprint=${sprintId}` : ""
      }`
    );
  }

  function openSprints(action?: "create") {
    router.push(
      `/${workspaceSlug}/projects/${projectSlug}/sprints${
        action ? "?action=create" : ""
      }`
    );
  }

  function scrollToToday() {
    if (!timeline || timeline.todayLeft === null || !timelineScrollRef.current) {
      return;
    }

    timelineScrollRef.current.scrollTo({
      left: Math.max(0, timeline.todayLeft - 420),
      behavior: "smooth",
    });
  }

  return (
    <div className="min-h-full bg-[var(--background)] p-6 text-[var(--text-primary)]">
      <section className="mb-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <CalendarDays size={16} />
              <span className="truncate">{projectSlug}</span>
            </div>

            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Timeline
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Review sprint dates, active work, upcoming cycles, and delivery
              progress across the project.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={scrollToToday}
              disabled={!timeline || timeline.todayLeft === null}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm font-medium text-[var(--text-primary)] shadow-xs transition hover:bg-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Clock size={16} />
              Today
            </button>

            <button
              type="button"
              onClick={() => openBoard()}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm font-medium text-[var(--text-primary)] shadow-xs transition hover:bg-[var(--secondary)]"
            >
              <ListTodo size={16} />
              Board
            </button>

            <Button
              type="button"
              className="inline-flex h-10 items-center gap-2"
              onClick={() => openSprints("create")}
            >
              <Plus size={16} />
              Create sprint
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <TimelineStatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <section className="mb-5 flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-wrap gap-2">
          {(["All", ...STATUS_ORDER] as TimelineFilter[]).map((filter) => (
            <FilterButton
              key={filter}
              label={filter}
              count={filterCounts[filter]}
              active={activeFilter === filter}
              onClick={() => setActiveFilter(filter)}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 px-1 text-xs text-[var(--text-secondary)]">
          {STATUS_ORDER.map((status) => (
            <span key={status} className="inline-flex items-center gap-1.5">
              <span
                className={`size-2 rounded-full ${statusTone[status].dot}`}
              />
              {status}
            </span>
          ))}
        </div>
      </section>

      {error ? (
        <div
          className={`rounded-2xl border p-4 text-sm ${classNames.danger.border} ${classNames.danger.bg} ${classNames.danger.text}`}
        >
          Failed to load timeline. Refresh the page or try again later.
        </div>
      ) : isLoading ? (
        <TimelineSkeleton />
      ) : data.length === 0 ? (
        <EmptyTimeline onCreate={() => openSprints("create")} />
      ) : !timeline ? (
        <EmptyFilteredTimeline onClear={() => setActiveFilter("All")} />
      ) : (
        <TimelineBoard
          timeline={timeline}
          scrollRef={timelineScrollRef}
          onOpenSprint={openBoard}
          onDatesPreview={(sprintId, nextDates) =>
            setLocalDates((prev) => ({
              ...prev,
              [sprintId]: nextDates,
            }))
          }
          onDatesCommit={(sprintId, nextDates) =>
            updateSprintDatesMutation.mutate({
              sprintId,
              ...nextDates,
            })
          }
        />
      )}
    </div>
  );
}

function TimelineBoard({
  timeline,
  scrollRef,
  onOpenSprint,
  onDatesPreview,
  onDatesCommit,
}: {
  timeline: {
    minDate: DateTime;
    totalDays: number;
    totalWidth: number;
    todayLeft: number | null;
    groups: { status: SprintStatus; sprints: Sprint[] }[];
  };
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onOpenSprint: (sprintId: string) => void;
  onDatesPreview: (
    sprintId: string,
    nextDates: { startDate: string; endDate: string }
  ) => void;
  onDatesCommit: (
    sprintId: string,
    nextDates: { startDate: string; endDate: string }
  ) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <div ref={scrollRef} className="max-h-[calc(100vh-22rem)] overflow-auto">
        <div
          className="grid min-h-full"
          style={{
            gridTemplateColumns: `${LEFT_PANEL_WIDTH}px ${timeline.totalWidth}px`,
          }}
        >
          <div className="sticky left-0 top-0 z-[60] flex h-16 items-center border-b border-r border-[var(--border)] bg-[var(--surface)] px-4 shadow-[8px_0_18px_rgba(0,0,0,0.12)]">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Sprint
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Date range and progress
              </p>
            </div>
          </div>

          <DateHeader
            minDate={timeline.minDate}
            totalDays={timeline.totalDays}
          />

          {timeline.groups.map((group) => (
            <TimelineGroup
              key={group.status}
              status={group.status}
              sprints={group.sprints}
              minDate={timeline.minDate}
              totalDays={timeline.totalDays}
              totalWidth={timeline.totalWidth}
              todayLeft={timeline.todayLeft}
              onOpenSprint={onOpenSprint}
              onDatesPreview={onDatesPreview}
              onDatesCommit={onDatesCommit}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function DateHeader({
  minDate,
  totalDays,
}: {
  minDate: DateTime;
  totalDays: number;
}) {
  const months = useMemo(() => {
    const segments: { label: string; span: number }[] = [];

    for (let index = 0; index < totalDays; index += 1) {
      const date = minDate.plus({ days: index });
      const label = date.toFormat("LLLL yyyy");
      const current = segments.at(-1);

      if (current?.label === label) {
        current.span += 1;
      } else {
        segments.push({ label, span: 1 });
      }
    }

    return segments;
  }, [minDate, totalDays]);

  return (
    <div className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]">
      <div
        className="grid border-b border-[var(--border)] text-xs font-semibold text-[var(--text-primary)]"
        style={{
          gridTemplateColumns: `${TIMELINE_GUTTER}px ${months
            .map((month) => `${month.span * DAY_WIDTH}px`)
            .join(" ")} ${TIMELINE_GUTTER}px`,
        }}
      >
        <div />
        {months.map((month) => (
          <div key={month.label} className="border-r border-[var(--border)] px-3 py-2">
            {month.label}
          </div>
        ))}
        <div />
      </div>

      <div
        className="grid h-10"
        style={{
          gridTemplateColumns: `${TIMELINE_GUTTER}px repeat(${totalDays}, ${DAY_WIDTH}px) ${TIMELINE_GUTTER}px`,
        }}
      >
        <div />

        {Array.from({ length: totalDays }).map((_, index) => {
          const date = minDate.plus({ days: index });
          const isWeekend = date.weekday === 6 || date.weekday === 7;
          const isToday = date.hasSame(DateTime.now(), "day");

          return (
            <div
              key={date.toISODate()}
              className={[
                "border-r border-[var(--border)] px-1 py-1 text-center text-[10px]",
                isToday
                  ? "bg-[var(--primary)]/10 font-semibold text-[var(--primary)]"
                  : isWeekend
                  ? "bg-[var(--secondary)]/40 text-[var(--text-secondary)]"
                  : "text-[var(--text-secondary)]",
              ].join(" ")}
            >
              <div>{date.toFormat("d")}</div>
              <div>{date.toFormat("ccc")}</div>
            </div>
          );
        })}

        <div />
      </div>
    </div>
  );
}

function TimelineGroup({
  status,
  sprints,
  minDate,
  totalDays,
  totalWidth,
  todayLeft,
  onOpenSprint,
  onDatesPreview,
  onDatesCommit,
}: {
  status: SprintStatus;
  sprints: Sprint[];
  minDate: DateTime;
  totalDays: number;
  totalWidth: number;
  todayLeft: number | null;
  onOpenSprint: (sprintId: string) => void;
  onDatesPreview: (
    sprintId: string,
    nextDates: { startDate: string; endDate: string }
  ) => void;
  onDatesCommit: (
    sprintId: string,
    nextDates: { startDate: string; endDate: string }
  ) => void;
}) {
  return (
    <>
      <div className="sticky left-0 z-30 flex h-11 items-center gap-2 border-b border-r border-[var(--border)] bg-[var(--background)] px-4 shadow-[8px_0_18px_rgba(0,0,0,0.12)]">
        <span className={`size-2 rounded-full ${statusTone[status].dot}`} />
        <span className="text-xs font-semibold text-[var(--text-primary)]">
          {status}
        </span>
        <span className="ml-auto rounded-full bg-[var(--secondary)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
          {sprints.length}
        </span>
      </div>

      <div
        className={`relative h-11 border-b border-[var(--border)] ${statusTone[status].rail}`}
        style={{ width: totalWidth }}
      >
        <GridBackground totalDays={totalDays} todayLeft={todayLeft} />
      </div>

      {sprints.map((sprint) => (
        <TimelineSprintRow
          key={sprint.id}
          sprint={sprint}
          minDate={minDate}
          totalDays={totalDays}
          totalWidth={totalWidth}
          todayLeft={todayLeft}
          onOpenSprint={onOpenSprint}
          onDatesPreview={onDatesPreview}
          onDatesCommit={onDatesCommit}
        />
      ))}
    </>
  );
}

function TimelineSprintRow({
  sprint,
  minDate,
  totalDays,
  totalWidth,
  todayLeft,
  onOpenSprint,
  onDatesPreview,
  onDatesCommit,
}: {
  sprint: Sprint;
  minDate: DateTime;
  totalDays: number;
  totalWidth: number;
  todayLeft: number | null;
  onOpenSprint: (sprintId: string) => void;
  onDatesPreview: (
    sprintId: string,
    nextDates: { startDate: string; endDate: string }
  ) => void;
  onDatesCommit: (
    sprintId: string,
    nextDates: { startDate: string; endDate: string }
  ) => void;
}) {
  const dragMovedRef = useRef(false);
  const [interactionDates, setInteractionDates] = useState<{
    startDate: string;
    endDate: string;
  } | null>(null);
  const start = DateTime.fromISO(sprint.startDate).startOf("day");
  const end = DateTime.fromISO(sprint.endDate).startOf("day");
  const offsetDays = Math.max(0, Math.floor(start.diff(minDate, "days").days));
  const durationDays = Math.max(1, Math.ceil(end.diff(start, "days").days) + 1);
  const left = TIMELINE_GUTTER + offsetDays * DAY_WIDTH;
  const width = Math.max(durationDays * DAY_WIDTH, 128);
  const isCompleted = sprint.status === "Completed";
  const sprintTitle = isCompleted
    ? `${sprint.name}: dates are locked because this sprint is completed`
    : `${sprint.name}: ${formatCompactDate(
        sprint.startDate
      )} - ${formatCompactDate(sprint.endDate)}`;

  function startInteraction(
    event: ReactMouseEvent,
    type: "move" | "resize-left" | "resize-right"
  ) {
    if (isCompleted) return;

    event.preventDefault();
    event.stopPropagation();

    dragMovedRef.current = false;

    const startX = event.clientX;
    const originalOffsetDays = offsetDays;
    const originalDurationDays = durationDays;
    let latestDates = {
      startDate: sprint.startDate,
      endDate: sprint.endDate,
    };
    setInteractionDates(latestDates);

    const calculateDates = (diffDays: number) => {
      let nextOffsetDays = originalOffsetDays;
      let nextDurationDays = originalDurationDays;

      if (type === "move") {
        nextOffsetDays = Math.max(0, originalOffsetDays + diffDays);
      }

      if (type === "resize-left") {
        const maxLeftMove = Math.max(0, originalDurationDays - 2);
        const safeDiffDays = Math.min(diffDays, maxLeftMove);

        nextOffsetDays = Math.max(0, originalOffsetDays + safeDiffDays);
        nextDurationDays = Math.max(2, originalDurationDays - safeDiffDays);
      }

      if (type === "resize-right") {
        nextDurationDays = Math.max(2, originalDurationDays + diffDays);
      }

      const nextStart = minDate.plus({ days: nextOffsetDays });
      const nextEnd = nextStart.plus({ days: nextDurationDays - 1 });

      return {
        startDate: nextStart.toISODate() ?? sprint.startDate,
        endDate: nextEnd.toISODate() ?? sprint.endDate,
      };
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diffPx = moveEvent.clientX - startX;

      if (Math.abs(diffPx) > 4) {
        dragMovedRef.current = true;
      }

      latestDates = calculateDates(Math.round(diffPx / DAY_WIDTH));
      setInteractionDates(latestDates);
      onDatesPreview(sprint.id, latestDates);
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      setInteractionDates(null);

      if (
        dragMovedRef.current &&
        (latestDates.startDate !== sprint.startDate ||
          latestDates.endDate !== sprint.endDate)
      ) {
        onDatesCommit(sprint.id, latestDates);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  return (
    <>
      <div className="sticky left-0 z-20 flex h-20 items-center border-b border-r border-[var(--border)] bg-[var(--surface)] px-4 shadow-[8px_0_18px_rgba(0,0,0,0.12)]">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <StatusBadge status={sprint.status} />
            <span className="text-xs text-[var(--text-secondary)]">
              {durationDays}d
            </span>
          </div>

          <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">
            {sprint.name}
          </h3>

          <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
            {sprint.goal || "No sprint goal yet."}
          </p>
        </div>
      </div>

      <div
        className="relative h-20 border-b border-[var(--border)] bg-[var(--surface)]"
        style={{ width: totalWidth }}
      >
        <GridBackground totalDays={totalDays} todayLeft={todayLeft} />

        <button
          type="button"
          onClick={() => {
            if (dragMovedRef.current) {
              dragMovedRef.current = false;
              return;
            }

            onOpenSprint(sprint.id);
          }}
          onMouseDown={(event) => {
            if (!isCompleted) {
              startInteraction(event, "move");
            }
          }}
          className={[
            "group absolute top-3 bottom-3 z-[1] overflow-hidden rounded-xl border border-white/25 px-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
            isCompleted
              ? "cursor-not-allowed"
              : "cursor-grab active:cursor-grabbing",
            statusTone[sprint.status].bar,
          ].join(" ")}
          style={{ left, width }}
          title={sprintTitle}
        >
          <div
            className="absolute inset-y-0 left-0 bg-white/25 transition-all"
            style={{ width: `${sprint.progress}%` }}
          />

          {!isCompleted && (
            <span
              onMouseDown={(event) => startInteraction(event, "resize-left")}
              className="absolute inset-y-0 left-0 z-20 flex w-5 cursor-ew-resize items-center justify-center rounded-l-xl bg-black/10 opacity-0 transition group-hover:opacity-100"
              title="Adjust start date"
            >
              <GripVertical size={12} />
            </span>
          )}

          <div className="relative z-10 flex h-full items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{sprint.name}</p>
              <p className="mt-1 truncate text-[10px] opacity-85">
                {formatCompactDate(sprint.startDate)} -{" "}
                {formatCompactDate(sprint.endDate)}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {isCompleted && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-black/15 px-2 py-0.5 text-[10px] font-semibold"
                  title="Completed sprints cannot be adjusted"
                >
                  <Lock size={10} />
                  Locked
                </span>
              )}

              <span className="rounded-full bg-black/15 px-2 py-0.5 text-[10px] font-semibold">
                {sprint.progress}%
              </span>
              <ArrowRight
                size={14}
                className="opacity-75 transition group-hover:translate-x-0.5 group-hover:opacity-100"
              />
            </div>
          </div>

          {!isCompleted && (
            <span
              onMouseDown={(event) => startInteraction(event, "resize-right")}
              className="absolute inset-y-0 right-0 z-20 flex w-5 cursor-ew-resize items-center justify-center rounded-r-xl bg-black/10 opacity-0 transition group-hover:opacity-100"
              title="Adjust end date"
            >
              <GripVertical size={12} />
            </span>
          )}
        </button>

        {interactionDates && !isCompleted && (
          <>
            <DatePreviewTooltip
              label="Start"
              value={interactionDates.startDate}
              className="-translate-x-1/2"
              style={{ left }}
            />

            <DatePreviewTooltip
              label="End"
              value={interactionDates.endDate}
              className="translate-x-1/2"
              style={{ left: left + width }}
            />
          </>
        )}
      </div>
    </>
  );
}

function DatePreviewTooltip({
  label,
  value,
  className,
  style,
}: {
  label: string;
  value: string;
  className: string;
  style: CSSProperties;
}) {
  return (
    <div
      className={`pointer-events-none absolute -top-3 z-30 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-center shadow-lg ${className}`}
      style={style}
    >
      <p className="text-[10px] font-medium uppercase text-[var(--text-secondary)]">
        {label}
      </p>
      <p className="whitespace-nowrap text-xs font-semibold text-[var(--text-primary)]">
        {formatTimelineDate(value)}
      </p>
    </div>
  );
}

function GridBackground({
  totalDays,
  todayLeft,
}: {
  totalDays: number;
  todayLeft: number | null;
}) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 grid"
        style={{
          gridTemplateColumns: `${TIMELINE_GUTTER}px repeat(${totalDays}, ${DAY_WIDTH}px) ${TIMELINE_GUTTER}px`,
        }}
      >
        <div />

        {Array.from({ length: totalDays }).map((_, index) => (
          <div
            key={index}
            className={[
              "border-r border-[var(--border)]/70",
              index % 7 === 5 || index % 7 === 6
                ? "bg-[var(--secondary)]/35"
                : index % 2 === 0
                ? "bg-[var(--background)]/30"
                : "bg-transparent",
            ].join(" ")}
          />
        ))}

        <div />
      </div>

      {todayLeft !== null && (
        <div
          className="pointer-events-none absolute inset-y-0 z-[2] w-px bg-[var(--primary)]"
          style={{ left: todayLeft }}
        >
          <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-[var(--primary)]" />
        </div>
      )}
    </>
  );
}

function FilterButton({
  label,
  count,
  active,
  onClick,
}: {
  label: TimelineFilter;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition",
        active
          ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm"
          : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]",
      ].join(" ")}
    >
      {label}
      <span
        className={[
          "rounded-full px-1.5 py-0.5 text-xs",
          active
            ? "bg-white/20 text-white"
            : "bg-[var(--secondary)] text-[var(--text-secondary)]",
        ].join(" ")}
      >
        {count}
      </span>
    </button>
  );
}

function StatusBadge({ status }: { status: SprintStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${statusTone[status].badge}`}
    >
      <span className={`size-1.5 rounded-full ${statusTone[status].dot}`} />
      {status}
    </span>
  );
}

function TimelineStatCard({
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
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-[var(--text-secondary)]">
          {label}
        </p>
        <Icon size={16} className="text-[var(--text-secondary)]" />
      </div>

      <p className="mt-3 text-xl font-semibold text-[var(--text-primary)]">
        {value}
      </p>

      <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
        {helper}
      </p>
    </div>
  );
}

function EmptyTimeline({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="flex min-h-[24rem] items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm">
      <div className="flex max-w-sm flex-col items-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--text-primary)]">
          <Flag size={22} />
        </div>

        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          No sprints yet
        </h2>

        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Create your first sprint to add planned delivery cycles to this
          timeline.
        </p>

        <Button
          type="button"
          onClick={onCreate}
          className="mt-5 inline-flex items-center gap-2"
        >
          <Plus size={16} />
          Create sprint
        </Button>
      </div>
    </section>
  );
}

function EmptyFilteredTimeline({ onClear }: { onClear: () => void }) {
  return (
    <section className="flex min-h-[18rem] items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm">
      <div className="flex max-w-sm flex-col items-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--text-primary)]">
          <LayoutGrid size={22} />
        </div>

        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          No sprints match this filter
        </h2>

        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Clear the filter to return to the full sprint timeline.
        </p>

        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex h-10 items-center rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--secondary)]"
        >
          Show all sprints
        </button>
      </div>
    </section>
  );
}

function TimelineSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-4 text-sm text-[var(--text-secondary)]">
        <Loader2 className="size-4 animate-spin" />
        Loading timeline...
      </div>

      <div className="grid grid-cols-[340px_1fr]">
        <div className="space-y-4 border-r border-[var(--border)] p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonLine key={index} />
          ))}
        </div>

        <div className="space-y-4 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-10 rounded-xl bg-[var(--secondary)]" />
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonLine() {
  return (
    <div>
      <div className="h-4 w-36 animate-pulse rounded-full bg-[var(--secondary)]" />
      <div className="mt-2 h-3 w-48 animate-pulse rounded-full bg-[var(--secondary)]" />
    </div>
  );
}

function formatCompactDate(value: string) {
  return DateTime.fromISO(value).toFormat("dd LLL");
}

function formatTimelineDate(value: string) {
  return DateTime.fromISO(value).toFormat("dd/MM/yyyy");
}
