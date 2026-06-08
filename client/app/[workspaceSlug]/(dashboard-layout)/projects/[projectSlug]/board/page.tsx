/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { toast, ToastContainer } from "react-toastify";
import useTasksByProjectSlug from "@/features/tasks/hooks/useTasksByProjectSlug";
import { Task } from "@/features/tasks/types";
import { TaskPriority, TaskStatus } from "@/shared/types/enums";
import useCreateTask from "@/features/tasks/hooks/useCreateTask";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock3,
  Filter,
  GripVertical,
  Plus,
  GitBranch,
  Layers3,
  ListTodo,
  type LucideIcon,
  RotateCcw,
  Users,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import CreateTaskModal from "./components/CreateTaskModal";
import useModal from "@/shared/hooks/useModal";
import TaskDetailsModal from "./components/TaskDetailsModal";
import useGetProjectMembers from "@/features/projects/hooks/useGetProjectMembers";
import { useQueryClient } from "@tanstack/react-query";
import useUpdateTask from "@/features/tasks/hooks/useUpdateTask";
import {
  classNames,
  taskPriorityColors,
  taskStatusConfig,
} from "@/shared/styles/classNames";
import Popover from "@/shared/ui/Popover";
import BoardFilters, {
  UNASSIGNED_EPIC_ID,
  UNASSIGNED_MEMBER_ID,
} from "./components/BoardFilters";
import useSlugs from "@/shared/hooks/useSlugs";
import SearchBar from "@/shared/ui/SearchBar";
import SkeletonLoading from "./components/SkeletonLoading";
import useGetProjectEpics from "@/features/projects/hooks/useGetProjectEpics";

const columns = [
  { key: TaskStatus.Backlog, title: "Backlog" },
  { key: TaskStatus.Todo, title: "To do" },
  { key: TaskStatus.In_Progress, title: "In progress" },
  { key: TaskStatus.Review, title: "Review" },
  { key: TaskStatus.Done, title: "Done" },
  { key: TaskStatus.Canceled, title: "Canceled" },
] as const;

const allStatuses = Object.values(TaskStatus);
const allPriorities = Object.values(TaskPriority);
const emptyQueryValue = "__empty__";

type BoardStatus = (typeof columns)[number]["key"];
type BoardColumn = (typeof columns)[number];
type FilterChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

function parseQueryList(value: string | null) {
  if (value === null) return null;
  if (value === "" || value === emptyQueryValue) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function filterValidValues<T extends string>(
  values: string[] | null,
  allowedValues: readonly T[]
) {
  if (values === null) return null;
  const allowed = new Set(allowedValues);

  return values.filter((value): value is T => allowed.has(value as T));
}

function isSameSet(a: readonly string[], b: readonly string[]) {
  if (a.length !== b.length) return false;
  const values = new Set(a);

  return b.every((item) => values.has(item));
}

function serializeFilterSelection(
  selected: readonly string[],
  allValues: readonly string[]
) {
  if (isSameSet(selected, allValues)) return null;
  if (selected.length === 0) return emptyQueryValue;

  return selected.join(",");
}

export default function ProjectBoardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const selectedTask = searchParams.get("selectedTask");

  const [refetchingTaskIds, setRefetchingTaskIds] = useState<string[]>([]);

  const slugs = useSlugs();
  const workspaceSlug = slugs.workspace.slug;
  const projectSlug = slugs.project.slug;

  const { data: members } = useGetProjectMembers(projectSlug, workspaceSlug);
  const { openModal, closeModal, isOpen: isOpenModal } = useModal();

  const {
    data: apiTasks,
    refetch: refechTasks,
    isLoading,
    isFetching,
    error,
  } = useTasksByProjectSlug(projectSlug, workspaceSlug);

  const createTaskMutation = useCreateTask(workspaceSlug, projectSlug);
  const { mutateAsync: updateTask } = useUpdateTask();

  const { data: epics } = useGetProjectEpics(workspaceSlug, projectSlug);

  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [boardTasks, setBoardTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>(() => {
    const values = filterValidValues(
      parseQueryList(searchParams.get("status")),
      allStatuses
    );

    return values ?? [...allStatuses];
  });
  const [selectedPriorities, setSelectedPriorities] = useState<TaskPriority[]>(
    () => {
      const values = filterValidValues(
        parseQueryList(searchParams.get("priority")),
        allPriorities
      );

      return values ?? [...allPriorities];
    }
  );
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [selectedReporterIds, setSelectedReporterIds] = useState<string[]>([]);
  const [selectedEpicIds, setSelectedEpicIds] = useState<string[]>([]);
  const [hasInitializedMembers, setHasInitializedMembers] = useState(false);
  const [hasInitializedEpics, setHasInitializedEpics] = useState(false);

  const canCreateTask =
    apiTasks?.currentUser.permissions.task.canCreateTask ?? false;

  const canUpdateTaskStatus =
    apiTasks?.currentUser.permissions.task.canUpdateTaskStatus ?? false;

  const memberIds = useMemo(
    () => (members ?? []).map((member) => member.id),
    [members]
  );

  const allAssigneeIds = useMemo(
    () => [...memberIds, UNASSIGNED_MEMBER_ID],
    [memberIds]
  );

  const epicIds = useMemo(() => (epics ?? []).map((epic) => epic.id), [epics]);

  const allEpicIds = useMemo(
    () => [...epicIds, UNASSIGNED_EPIC_ID],
    [epicIds]
  );

  useEffect(() => {
    setMounted(true);
    setCurrentTime(Date.now());
  }, []);

  useEffect(() => {
    if (!apiTasks) return;
    setBoardTasks(apiTasks.tasks);
  }, [apiTasks, isFetching]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 2,
      },
    })
  );

  const filteredTasks = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const prioritySet = new Set(selectedPriorities);
    const assigneeSet = new Set(selectedAssigneeIds);
    const reporterSet = new Set(selectedReporterIds);
    const epicSet = new Set(selectedEpicIds);
    const memberFiltersReady = (members?.length ?? 0) > 0;
    const epicFiltersReady = epics !== undefined;

    return boardTasks.filter((task) => {
      const matchesSearch =
        !keyword ||
        task.title.toLowerCase().includes(keyword) ||
        task.id.toLowerCase().includes(keyword) ||
        task.assignee?.fullName?.toLowerCase().includes(keyword) ||
        task.creator?.fullName?.toLowerCase().includes(keyword);

      const matchesAssignee =
        !memberFiltersReady && selectedAssigneeIds.length === 0
          ? true
          : assigneeSet.has(task.assignee?.id ?? "") ||
            (!task.assignee && assigneeSet.has(UNASSIGNED_MEMBER_ID));

      const matchesReporter =
        !memberFiltersReady && selectedReporterIds.length === 0
          ? true
          : reporterSet.has(task.creator?.id ?? "");

      const matchesEpic =
        !epicFiltersReady && selectedEpicIds.length === 0
          ? true
          : epicSet.has(task.epic?.id ?? "") ||
            (!task.epic && epicSet.has(UNASSIGNED_EPIC_ID));

      return (
        matchesSearch &&
        prioritySet.has(task.priority) &&
        matchesAssignee &&
        matchesReporter &&
        matchesEpic
      );
    });
  }, [
    boardTasks,
    search,
    selectedPriorities,
    selectedAssigneeIds,
    selectedReporterIds,
    selectedEpicIds,
    members,
    epics,
  ]);

  const tasksByStatus = useMemo(() => {
    return columns.reduce<Record<BoardStatus, Task[]>>((acc, column) => {
      acc[column.key] = filteredTasks
        .filter((task) => task.status === column.key)
        .sort((a, b) => a.position - b.position);

      return acc;
    }, {} as Record<BoardStatus, Task[]>);
  }, [filteredTasks]);

  const visibleColumns = useMemo(() => {
    return columns.filter((column) => selectedStatuses.includes(column.key));
  }, [selectedStatuses]);

  const visibleTaskCount = useMemo(() => {
    return filteredTasks.filter((task) => selectedStatuses.includes(task.status))
      .length;
  }, [filteredTasks, selectedStatuses]);

  const activeTask = useMemo(() => {
    if (!activeTaskId) return null;
    return boardTasks.find((task) => task.id === activeTaskId) ?? null;
  }, [activeTaskId, boardTasks]);

  const boardStats = useMemo(() => {
    return {
      total: boardTasks.length,
      active: boardTasks.filter(
        (task) =>
          task.status === TaskStatus.Todo ||
          task.status === TaskStatus.In_Progress ||
          task.status === TaskStatus.Review
      ).length,
      overdue: boardTasks.filter((task) => {
        if (!task.dueDate) return false;
        if (
          task.status === TaskStatus.Done ||
          task.status === TaskStatus.Canceled
        ) {
          return false;
        }

        return (
          currentTime !== null && new Date(task.dueDate).getTime() < currentTime
        );
      }).length,
      done: boardTasks.filter((task) => task.status === TaskStatus.Done).length,
    };
  }, [boardTasks, currentTime]);

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (search.trim()) count += 1;
    if (!isSameSet(selectedStatuses, allStatuses)) count += 1;
    if (!isSameSet(selectedPriorities, allPriorities)) count += 1;
    if (
      hasInitializedMembers &&
      !isSameSet(selectedAssigneeIds, allAssigneeIds)
    ) {
      count += 1;
    }
    if (hasInitializedMembers && !isSameSet(selectedReporterIds, memberIds)) {
      count += 1;
    }
    if (hasInitializedEpics && !isSameSet(selectedEpicIds, allEpicIds)) {
      count += 1;
    }

    return count;
  }, [
    search,
    hasInitializedMembers,
    hasInitializedEpics,
    allAssigneeIds,
    memberIds,
    allEpicIds,
    selectedStatuses,
    selectedPriorities,
    selectedAssigneeIds,
    selectedReporterIds,
    selectedEpicIds,
  ]);

  const resetBoardFilters = () => {
    setSearch("");
    setSelectedStatuses([...allStatuses]);
    setSelectedPriorities([...allPriorities]);
    setSelectedAssigneeIds([...allAssigneeIds]);
    setSelectedReporterIds([...memberIds]);
    setSelectedEpicIds([...allEpicIds]);
  };

  const appliedFilterChips = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    const memberById = new Map(
      (members ?? []).map((member) => [
        member.id,
        member.fullName || member.username || member.email,
      ])
    );
    const epicById = new Map((epics ?? []).map((epic) => [epic.id, epic.title]));
    const summarize = (
      selected: readonly string[],
      allValues: readonly string[],
      getLabel: (value: string) => string
    ) => {
      if (isSameSet(selected, allValues)) return null;
      if (selected.length === 0) return "None";
      if (selected.length <= 2) return selected.map(getLabel).join(", ");

      return `${selected.length} selected`;
    };

    if (search.trim()) {
      chips.push({
        key: "search",
        label: `Search: ${search.trim()}`,
        onRemove: () => setSearch(""),
      });
    }

    const statusSummary = summarize(
      selectedStatuses,
      allStatuses,
      (status) => taskStatusConfig[status as TaskStatus].label
    );
    if (statusSummary) {
      chips.push({
        key: "status",
        label: `Status: ${statusSummary}`,
        onRemove: () => setSelectedStatuses([...allStatuses]),
      });
    }

    const prioritySummary = summarize(
      selectedPriorities,
      allPriorities,
      (priority) => priority
    );
    if (prioritySummary) {
      chips.push({
        key: "priority",
        label: `Priority: ${prioritySummary}`,
        onRemove: () => setSelectedPriorities([...allPriorities]),
      });
    }

    if (hasInitializedMembers) {
      const assigneeSummary = summarize(
        selectedAssigneeIds,
        allAssigneeIds,
        (assigneeId) =>
          assigneeId === UNASSIGNED_MEMBER_ID
            ? "Unassigned"
            : memberById.get(assigneeId) ?? "Unknown member"
      );
      if (assigneeSummary) {
        chips.push({
          key: "assignee",
          label: `Assignee: ${assigneeSummary}`,
          onRemove: () => setSelectedAssigneeIds([...allAssigneeIds]),
        });
      }

      const reporterSummary = summarize(
        selectedReporterIds,
        memberIds,
        (reporterId) => memberById.get(reporterId) ?? "Unknown reporter"
      );
      if (reporterSummary) {
        chips.push({
          key: "reporter",
          label: `Reporter: ${reporterSummary}`,
          onRemove: () => setSelectedReporterIds([...memberIds]),
        });
      }
    }

    if (hasInitializedEpics) {
      const epicSummary = summarize(
        selectedEpicIds,
        allEpicIds,
        (epicId) =>
          epicId === UNASSIGNED_EPIC_ID
            ? "No epic"
            : epicById.get(epicId) ?? "Unknown epic"
      );
      if (epicSummary) {
        chips.push({
          key: "epic",
          label: `Epic: ${epicSummary}`,
          onRemove: () => setSelectedEpicIds([...allEpicIds]),
        });
      }
    }

    return chips;
  }, [
    search,
    members,
    epics,
    selectedStatuses,
    selectedPriorities,
    selectedAssigneeIds,
    selectedReporterIds,
    selectedEpicIds,
    hasInitializedMembers,
    hasInitializedEpics,
    allAssigneeIds,
    memberIds,
    allEpicIds,
  ]);

  const buildBoardUrl = (params: URLSearchParams) => {
    const nextQuery = params.toString();

    return `/${workspaceSlug}/projects/${projectSlug}/board${
      nextQuery ? `?${nextQuery}` : ""
    }`;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTaskId(null);

    const { active, over } = event;

    if (!over) return;

    const taskId = String(active.id);
    const nextStatus = String(over.id) as BoardStatus;

    if (!columns.some((column) => column.key === nextStatus)) return;

    setBoardTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: nextStatus,
            }
          : task
      )
    );

    try {
      setRefetchingTaskIds((curr) => [...curr, taskId]);
      await updateTask({
        status: nextStatus,
        workspaceSlug,
        taskId,
        projectSlug,
      });
      await queryClient.refetchQueries({
        queryKey: ["get-task-by-id", taskId, projectSlug, workspaceSlug],
        type: "all",
      });
      setRefetchingTaskIds((curr) => curr.filter((tId) => tId !== taskId));
    } catch (error: unknown) {
      const err = error as Error;
      toast.update("update-task", {
        render: err.message || "Failed to update task",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleOpenTaskDetails = (taskId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("selectedTask", taskId);
    router.push(buildBoardUrl(params));
  };

  const handleOpenCreateTaskModal = (status: BoardStatus = TaskStatus.Todo) => {
    if (!canCreateTask) return;

    openModal({
      title: "Create new task",
      modalContent: (
        <CreateTaskModal
          defaultStatus={status}
          isLoading={createTaskMutation.isPending}
          key={createTaskMutation.isPending + ""}
          onClose={closeModal}
          onCreate={async (values) => {
            await createTaskMutation.mutateAsync(values);
            await refechTasks();
            closeModal();
          }}
        />
      ),
    });
  };

  useEffect(() => {
    if (!members) return;

    const assigneeParams = parseQueryList(searchParams.get("assignee"));
    const reporterParams = parseQueryList(searchParams.get("reporter"));
    const validAssigneeIds = new Set(allAssigneeIds);
    const validReporterIds = new Set(memberIds);

    if (!hasInitializedMembers) {
      setSelectedAssigneeIds(
        assigneeParams === null
          ? [...allAssigneeIds]
          : assigneeParams.filter((id) => validAssigneeIds.has(id))
      );
      setSelectedReporterIds(
        reporterParams === null
          ? [...memberIds]
          : reporterParams.filter((id) => validReporterIds.has(id))
      );
      setHasInitializedMembers(true);
      return;
    }

    setSelectedAssigneeIds((current) =>
      current.filter((id) => validAssigneeIds.has(id))
    );
    setSelectedReporterIds((current) =>
      current.filter((id) => validReporterIds.has(id))
    );
  }, [
    members,
    searchParams,
    allAssigneeIds,
    memberIds,
    hasInitializedMembers,
  ]);

  useEffect(() => {
    if (!epics) return;

    const epicParams = parseQueryList(searchParams.get("epic"));
    const validEpicIds = new Set(allEpicIds);

    if (!hasInitializedEpics) {
      setSelectedEpicIds(
        epicParams === null
          ? [...allEpicIds]
          : epicParams.filter((id) => validEpicIds.has(id))
      );
      setHasInitializedEpics(true);
      return;
    }

    setSelectedEpicIds((current) =>
      current.filter((id) => validEpicIds.has(id))
    );
  }, [epics, searchParams, allEpicIds, hasInitializedEpics]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    const setOrDelete = (key: string, value: string | null) => {
      if (value === null) {
        params.delete(key);
        return;
      }

      params.set(key, value);
    };

    setOrDelete("q", search.trim() ? search.trim() : null);
    setOrDelete(
      "status",
      serializeFilterSelection(selectedStatuses, allStatuses)
    );
    setOrDelete(
      "priority",
      serializeFilterSelection(selectedPriorities, allPriorities)
    );

    if (hasInitializedMembers) {
      setOrDelete(
        "assignee",
        serializeFilterSelection(selectedAssigneeIds, allAssigneeIds)
      );
      setOrDelete(
        "reporter",
        serializeFilterSelection(selectedReporterIds, memberIds)
      );
    }

    if (hasInitializedEpics) {
      setOrDelete(
        "epic",
        serializeFilterSelection(selectedEpicIds, allEpicIds)
      );
    }

    if (params.toString() !== searchParams.toString()) {
      router.replace(buildBoardUrl(params), { scroll: false });
    }
  }, [
    search,
    searchParams,
    router,
    selectedStatuses,
    selectedPriorities,
    selectedAssigneeIds,
    selectedReporterIds,
    selectedEpicIds,
    hasInitializedMembers,
    hasInitializedEpics,
    allAssigneeIds,
    memberIds,
    allEpicIds,
  ]);

  useEffect(() => {
    if (selectedTask) {
      openModal({
        title: "Task details",
        showHeader: false,
        modalContent: (
          <TaskDetailsModal
            epics={epics || []}
            members={members ?? []}
            taskId={selectedTask}
            canUpdateTask={
              apiTasks?.currentUser.permissions.task.canUpdateTask ?? false
            }
            canAssignTask={
              apiTasks?.currentUser.permissions.task.canAssignTask ?? false
            }
            onClose={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete("selectedTask");
              router.push(buildBoardUrl(params));
              closeModal();
            }}
            onUpdate={() => {
              queryClient.invalidateQueries({
                queryKey: [
                  "get-tasks-by-project-slug",
                  projectSlug,
                  workspaceSlug,
                ],
              });
              closeModal();
            }}
            onClickSubtask={(subtask) => {
              handleOpenTaskDetails(subtask.id);
            }}
          />
        ),
      });
    }
  }, [selectedTask]);

  useEffect(() => {
    if (!isOpenModal && selectedTask) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("selectedTask");
      router.replace(buildBoardUrl(params), { scroll: false });
    }
  }, [isOpenModal, selectedTask, searchParams, router]);

  if (isLoading) {
    return <SkeletonLoading />;
  }

  if (error) {
    return (
      <div
        className={`flex h-full items-center justify-center text-sm ${classNames.danger.text}`}
      >
        Failed to load tasks.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-5 bg-[var(--background)] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-normal text-[var(--text-primary)]">
              Board
            </h1>
            {isFetching && (
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">
                Syncing
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {visibleTaskCount} visible of {boardTasks.length} tasks
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <BoardMetric icon={ListTodo} label="Total" value={boardStats.total} />
          <BoardMetric icon={Users} label="Active" value={boardStats.active} />
          <BoardMetric
            icon={Clock3}
            label="Overdue"
            value={boardStats.overdue}
          />
          <BoardMetric
            icon={CheckCircle2}
            label="Done"
            value={boardStats.done}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-xs">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search title, ID, assignee..."
          className="max-w-md"
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Popover
              position="left"
              onClose={() => setIsFilterOpen(false)}
              isOpen={isFilterOpen}
              content={
                <BoardFilters
                  members={members || []}
                  epics={epics || []}
                  selectedPriorities={selectedPriorities}
                  onSelectAllPriorities={() =>
                    setSelectedPriorities([...allPriorities])
                  }
                  onClearPriorities={() => setSelectedPriorities([])}
                  onPriorityClicked={(priority) => {
                    setSelectedPriorities((curr) =>
                      curr.includes(priority)
                        ? curr.filter((item) => item !== priority)
                        : [...curr, priority]
                    );
                  }}
                  selectedStatuses={selectedStatuses}
                  onSelectAllStatuses={() =>
                    setSelectedStatuses([...allStatuses])
                  }
                  onClearStatuses={() => setSelectedStatuses([])}
                  onStatusClicked={(status) => {
                    setSelectedStatuses((curr) =>
                      curr.includes(status)
                        ? curr.filter((item) => item !== status)
                        : [...curr, status]
                    );
                  }}
                  selectedAssigneeIds={selectedAssigneeIds}
                  onSelectAllAssignees={() =>
                    setSelectedAssigneeIds([...allAssigneeIds])
                  }
                  onClearAssignees={() => setSelectedAssigneeIds([])}
                  onAssigneeClicked={(memberId) => {
                    setSelectedAssigneeIds((curr) =>
                      curr.includes(memberId)
                        ? curr.filter((item) => item !== memberId)
                        : [...curr, memberId]
                    );
                  }}
                  selectedReporterIds={selectedReporterIds}
                  onSelectAllReporters={() =>
                    setSelectedReporterIds([...memberIds])
                  }
                  onClearReporters={() => setSelectedReporterIds([])}
                  onReporterClicked={(memberId) => {
                    setSelectedReporterIds((curr) =>
                      curr.includes(memberId)
                        ? curr.filter((item) => item !== memberId)
                        : [...curr, memberId]
                    );
                  }}
                  selectedEpicIds={selectedEpicIds}
                  onSelectAllEpics={() => setSelectedEpicIds([...allEpicIds])}
                  onClearEpics={() => setSelectedEpicIds([])}
                  onEpicClicked={(epicId) => {
                    setSelectedEpicIds((curr) =>
                      curr.includes(epicId)
                        ? curr.filter((item) => item !== epicId)
                        : [...curr, epicId]
                    );
                  }}
                />
              }
            >
              <button
                type="button"
                onClick={() => setIsFilterOpen((curr) => !curr)}
                className="flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm font-medium text-[var(--text-primary)] shadow-xs transition hover:bg-[var(--secondary)]"
              >
                <Filter size={15} />
                Filter
                <span className="rounded-full bg-[var(--secondary)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                  {activeFilterCount}
                </span>
              </button>
            </Popover>
          </div>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetBoardFilters}
              className="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]"
            >
              <RotateCcw size={15} />
              Reset
            </button>
          )}
        </div>
      </div>

      {appliedFilterChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {appliedFilterChips.map((chip) => (
            <FilterChipButton key={chip.key} chip={chip} />
          ))}
        </div>
      )}

      {visibleColumns.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[var(--border)] text-sm text-[var(--text-secondary)]">
          No columns selected.
        </div>
      ) : boardTasks.length > 0 && filteredTasks.length === 0 ? (
        <EmptyBoardState
          title="No tasks match your filters"
          description="Reset filters or search for a different task."
          action={
            <button
              type="button"
              onClick={resetBoardFilters}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text-primary)] shadow-xs transition hover:bg-[var(--secondary)]"
            >
              <RotateCcw size={15} />
              Reset filters
            </button>
          }
        />
      ) : boardTasks.length === 0 ? (
        <EmptyBoardState
          title="No tasks yet"
          description={
            canCreateTask
              ? "Create the first task to start planning this project."
              : "Tasks created for this project will appear here."
          }
          action={
            canCreateTask ? (
              <button
                type="button"
                onClick={() => handleOpenCreateTaskModal(TaskStatus.Todo)}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--on-primary)] shadow-xs transition hover:brightness-95"
              >
                <Plus size={15} />
                Create task
              </button>
            ) : null
          }
        />
      ) : mounted ? (
        <DndContext
          sensors={sensors}
          onDragStart={canUpdateTaskStatus ? handleDragStart : undefined}
          onDragEnd={canUpdateTaskStatus ? handleDragEnd : undefined}
          onDragCancel={() => setActiveTaskId(null)}
        >
          <BoardColumns
            refetchingTaskIds={refetchingTaskIds}
            columns={visibleColumns}
            canCreateTask={canCreateTask}
            tasksByStatus={tasksByStatus}
            canUpdateTaskStatus={canUpdateTaskStatus}
            onCreateTask={handleOpenCreateTaskModal}
            onOpenTaskDetails={handleOpenTaskDetails}
          />
          <DragOverlay zIndex={10000}>
            {activeTask ? <TaskCardPreview task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <BoardColumns
          refetchingTaskIds={refetchingTaskIds}
          columns={visibleColumns}
          canCreateTask={canCreateTask}
          tasksByStatus={tasksByStatus}
          disabled
          canUpdateTaskStatus={canUpdateTaskStatus}
          onCreateTask={handleOpenCreateTaskModal}
          onOpenTaskDetails={handleOpenTaskDetails}
        />
      )}

      <ToastContainer />
    </div>
  );
}

function BoardColumns({
  columns,
  tasksByStatus,
  disabled = false,
  onCreateTask,
  canCreateTask,
  canUpdateTaskStatus,
  onOpenTaskDetails,
  refetchingTaskIds,
}: {
  columns: readonly BoardColumn[];
  tasksByStatus: Record<BoardStatus, Task[]>;
  disabled?: boolean;
  onCreateTask: (status: BoardStatus) => void;
  canCreateTask: boolean;
  canUpdateTaskStatus: boolean;
  onOpenTaskDetails: (taskID: string) => void;
  refetchingTaskIds: string[];
}) {
  return (
    <div className="flex flex-1 gap-4 overflow-x-auto overflow-y-hidden pb-4">
      {columns.map((column) => (
        <KanbanColumn
          key={column.key}
          id={column.key}
          title={column.title}
          tasks={tasksByStatus[column.key] ?? []}
          disabled={disabled}
          canUpdateTaskStatus={canUpdateTaskStatus}
          canCreateTask={canCreateTask}
          onCreateTask={onCreateTask}
          onOpenTaskDetails={onOpenTaskDetails}
          refetchingTaskIds={refetchingTaskIds}
        />
      ))}
    </div>
  );
}

function BoardMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="flex min-w-[118px] items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-xs">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--secondary)] text-[var(--text-primary)]">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[var(--text-secondary)]">{label}</p>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {value}
        </p>
      </div>
    </div>
  );
}

function EmptyBoardState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/55 p-8">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--text-primary)]">
          <ListTodo size={22} />
        </div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {description}
        </p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}

function FilterChipButton({ chip }: { chip: FilterChip }) {
  return (
    <button
      type="button"
      onClick={chip.onRemove}
      className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-medium text-[var(--text-secondary)] shadow-xs transition hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]"
      title={`Remove ${chip.label}`}
    >
      <span className="truncate">{chip.label}</span>
      <X size={13} className="shrink-0" />
    </button>
  );
}

function KanbanColumn({
  id,
  title,
  tasks,
  disabled,
  canCreateTask,
  onCreateTask,
  canUpdateTaskStatus,
  onOpenTaskDetails,
  refetchingTaskIds,
}: {
  id: BoardStatus;
  title: string;
  tasks: Task[];
  canCreateTask: boolean;
  disabled?: boolean;
  onCreateTask: (status: BoardStatus) => void;
  canUpdateTaskStatus: boolean;
  onOpenTaskDetails: (taskId: string) => void;
  refetchingTaskIds: string[];
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled: disabled || !canUpdateTaskStatus,
  });
  const statusStyle = taskStatusConfig[id];
  const columnStyle: CSSProperties = {
    borderColor: "var(--border)",
    background: isOver
      ? `color-mix(in srgb, ${statusStyle.bg} 34%, var(--background))`
      : `color-mix(in srgb, ${statusStyle.bg} 12%, var(--background))`,
    boxShadow: isOver
      ? `0 0 0 3px color-mix(in srgb, ${statusStyle.bg} 72%, transparent), 0 18px 44px color-mix(in srgb, ${statusStyle.bg} 28%, transparent)`
      : undefined,
  };

  return (
    <section
      ref={setNodeRef}
      style={columnStyle}
      className={`
        w-[320px]
        min-w-[320px]
        shrink-0
        min-h-[560px]
        rounded-xl
        border
        p-3 shadow-sm
        relative
        overflow-y-auto
        transition
        duration-200
      `}
    >
      {isOver && (
        <div
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{
            background: `linear-gradient(135deg, color-mix(in srgb, ${statusStyle.bg} 28%, transparent), transparent 58%)`,
            boxShadow: `inset 0 0 0 2px ${statusStyle.bg}`,
          }}
        />
      )}

      <div
        className="relative mb-3 h-1 rounded-full"
        style={{ background: statusStyle.bg }}
      />

      <div className="relative mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <CircleDot size={14} style={{ color: statusStyle.bg }} />

          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {title}
          </h2>

          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{
              background: statusStyle.bg,
              color: statusStyle.text,
            }}
          >
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="relative space-y-3">
        {" "}
        {canCreateTask && (
          <button
            type="button"
            onClick={() => onCreateTask(id)}
            className="sticky top-0 z-10 flex h-10 w-full cursor-pointer items-center justify-center
            gap-2 rounded-xl border border-dashed bg-[var(--background)]
            border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
            style={{ borderColor: statusStyle.bg }}
          >
            <Plus size={15} />
            Add task
          </button>
        )}
        {tasks.map((task) => (
          <TaskCard
            isRefetching={refetchingTaskIds.includes(task.id)}
            key={task.id}
            task={task}
            canUpdateTaskStatus={canUpdateTaskStatus}
            disabled={disabled || !canUpdateTaskStatus}
            onOpenTaskDetails={onOpenTaskDetails}
          />
        ))}

        {tasks.length === 0 && (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)]/55 px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
            No tasks in {title.toLowerCase()}.
          </div>
        )}
      </div>
    </section>
  );
}

function TaskCard({
  task,
  disabled,
  isRefetching,
  canUpdateTaskStatus,
  onOpenTaskDetails,
}: {
  task: Task;
  disabled?: boolean;
  canUpdateTaskStatus: boolean;
  isRefetching: boolean;
  onOpenTaskDetails: (taskId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    disabled,
  });

  const style: CSSProperties = {
    opacity: isDragging ? 0.35 : undefined,
  };

  const assigneeInitial =
    task.assignee?.fullName
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  const handleDragAttempt = () => {
    if (!canUpdateTaskStatus) {
      toast.error("You do not have permission to move tasks", {
        toastId: "task-move-permission",
      });
    }
  };

  return (
    <div className={`relative rounded-xl ${isDragging ? "z-50" : "z-0"}`}>
      {isRefetching && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-xl bg-[var(--surface)]/55 backdrop-blur-[2px]">
          <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)]/90 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] shadow-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--primary)]" />
            Updating
          </div>
        </div>
      )}
      <article
        onClick={() => onOpenTaskDetails(task.id)}
        onPointerDown={(e) => {
          e.stopPropagation();

          if (!canUpdateTaskStatus) {
            handleDragAttempt();
          }
        }}
        ref={setNodeRef}
        style={style}
        className={`
        cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs outline-none
        ${
          isDragging
            ? "scale-[1.02] opacity-80 shadow-lg"
            : "transition-all hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:shadow-md"
        }
      `}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <TaskRelationBadges task={task} />

            <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-[var(--text-primary)]">
              {task.title}
            </h3>
          </div>

          <button
            type="button"
            onPointerDown={!canUpdateTaskStatus ? handleDragAttempt : undefined}
            {...(canUpdateTaskStatus ? listeners : {})}
            {...(canUpdateTaskStatus ? attributes : {})}
            className={`
            rounded-md p-1 transition
            ${
              canUpdateTaskStatus
                ? "cursor-grab text-[var(--text-secondary)] hover:bg-[var(--secondary)] active:cursor-grabbing"
                : "cursor-not-allowed text-[var(--text-secondary)]/50"
            }
          `}
          >
            <GripVertical size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            {task.dueDate && (
              <>
                <CalendarDays size={14} />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <PriorityBadge priority={task.priority} />

            {task.assignee &&
              (task.assignee.avatarURL ? (
                <img
                  alt={`${task.assignee.username}-avatar`}
                  src={task.assignee.avatarURL}
                  className="w-7 h-7 rounded-full"
                />
              ) : (
                <div
                  title={task.assignee?.fullName ?? "Unassigned"}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--secondary)] text-xs font-bold text-[var(--text-secondary)]"
                >
                  {assigneeInitial}
                </div>
              ))}
          </div>
        </div>
      </article>
    </div>
  );
}

function TaskCardPreview({ task }: { task: Task }) {
  const assigneeInitial =
    task.assignee?.fullName
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  return (
    <article className="w-[296px] cursor-grabbing rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 opacity-95 shadow-2xl">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <TaskRelationBadges task={task} />

          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-[var(--text-primary)]">
            {task.title}
          </h3>
        </div>

        <div className="rounded-md p-1 text-[var(--text-secondary)]">
          <GripVertical size={16} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          {task.dueDate && (
            <>
              <CalendarDays size={14} />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <PriorityBadge priority={task.priority} />

          <div
            title={task.assignee?.fullName ?? "Unassigned"}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-[var(--ink)]"
          >
            {assigneeInitial}
          </div>
        </div>
      </div>
    </article>
  );
}

function PriorityBadge({ priority }: { priority: Task["priority"] }) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-[11px] font-semibold ${taskPriorityColors[priority]}`}
    >
      {priority}
    </span>
  );
}

function TaskRelationBadges({ task }: { task: Task }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5">
      {task.epic && (
        <div
          className="mb-2 rounded-lg border px-2.5 py-2"
          style={{
            borderColor: task.epic.color ?? "var(--primary)",
            background: `color-mix(in srgb, ${
              task.epic.color ?? "var(--primary)"
            } 12%, transparent)`,
          }}
        >
          <div className="mb-1 flex items-center gap-2">
            <Layers3
              size={12}
              style={{
                color: task.epic.color ?? "var(--primary)",
              }}
            />

            <span
              className="text-[10px] font-black tracking-wider uppercase"
              style={{
                color: task.epic.color ?? "var(--primary)",
              }}
            >
              EPIC
            </span>
          </div>

          <p
            className="line-clamp-1 text-xs font-semibold"
            style={{
              color: task.epic.color ?? "var(--primary)",
            }}
          >
            {task.epic.title}
          </p>
        </div>
      )}

      {task.parentTask && (
        <div className="mb-2 flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <GitBranch size={12} />
          <span className="truncate">{task.parentTask.title}</span>
        </div>
      )}
    </div>
  );
}
