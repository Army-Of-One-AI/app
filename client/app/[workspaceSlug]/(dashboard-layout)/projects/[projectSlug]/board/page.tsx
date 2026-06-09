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
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  CheckCircle2,
  Clock3,
  Filter,
  ListTodo,
  Plus,
  RotateCcw,
  Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import CreateTaskModal from "./components/CreateTaskModal";
import useModal from "@/shared/hooks/useModal";
import TaskDetailsModal from "./components/TaskDetailsModal";
import useGetProjectMembers from "@/features/projects/hooks/useGetProjectMembers";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useUpdateTask from "@/features/tasks/hooks/useUpdateTask";
import { classNames, taskStatusConfig } from "@/shared/styles/classNames";
import Popover from "@/shared/ui/Popover";
import BoardFilters, {
  UNASSIGNED_EPIC_ID,
  UNASSIGNED_MEMBER_ID,
  UNLABELLED_LABEL_ID,
} from "./components/BoardFilters";
import useSlugs from "@/shared/hooks/useSlugs";
import SearchBar from "@/shared/ui/SearchBar";
import SkeletonLoading from "./components/SkeletonLoading";
import useGetProjectEpics from "@/features/projects/hooks/useGetProjectEpics";
import { DateTime } from "luxon";
import { apiClient } from "@/shared/api/apiClient";
import { Sprint } from "@/features/sprints/types";
import BoardColumns from "./components/BoardColumn";
import TaskCardPreview from "./components/TaskCardPreview";
import BoardMetric from "./components/BoardMetric";
import EmptyBoardState from "./components/EmptyBoardState";
import FilterChipButton from "./components/FilterChipButton";
import useTaskLabels from "@/features/tasks/hooks/useTaskLabels";

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

export type BoardStatus = (typeof columns)[number]["key"];
export type BoardColumn = (typeof columns)[number];

export type FilterChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

export type EpicSummary = {
  id: string;
  title: string;
  color?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  totalTasks: number;
  doneTasks: number;
  progress: number;
  health: "Healthy" | "At risk" | "Off track" | "Completed";
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
  const action = searchParams.get("action");

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

  const { data: labels } = useTaskLabels(workspaceSlug, projectSlug);

  const createTaskMutation = useCreateTask(workspaceSlug, projectSlug);
  const { mutateAsync: updateTask } = useUpdateTask();

  const { data: epics } = useGetProjectEpics(workspaceSlug, projectSlug);

  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [boardTasks, setBoardTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(
    searchParams.get("sprint")
  );

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
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [hasInitializedMembers, setHasInitializedMembers] = useState(false);
  const [hasInitializedEpics, setHasInitializedEpics] = useState(false);
  const [hasInitializedLabels, setHasInitializedLabels] = useState(false);
  const [selectedSprintIds, setSelectedSprintIds] = useState<string[]>(() => {
    const sprintParam = parseQueryList(searchParams.get("sprint"));
    return sprintParam ?? [];
  });

  const { data: sprints = [] } = useQuery({
    queryKey: ["project-sprints", workspaceSlug, projectSlug],
    queryFn: async () => {
      const res = await apiClient.get<Sprint[]>(
        `/workspaces/${workspaceSlug}/projects/${projectSlug}/sprints`
      );

      return res.data;
    },
    enabled: !!workspaceSlug && !!projectSlug,
  });

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

  const activeSprint = useMemo(() => {
    return sprints.find((sprint) => sprint.status === "Active") ?? null;
  }, [sprints]);

  const selectedSprint = useMemo(() => {
    if (!selectedSprintId) return null;

    return sprints.find((sprint) => sprint.id === selectedSprintId) ?? null;
  }, [sprints, selectedSprintId]);

  const sprintTaskCount = useMemo(() => {
    const map = new Map<string, number>();

    for (const task of boardTasks) {
      if (!task.sprint?.id) continue;

      map.set(task.sprint.id, (map.get(task.sprint.id) ?? 0) + 1);
    }

    return map;
  }, [boardTasks]);

  const epicIds = useMemo(() => (epics ?? []).map((epic) => epic.id), [epics]);

  const allEpicIds = useMemo(() => [...epicIds, UNASSIGNED_EPIC_ID], [epicIds]);

  const labelIds = useMemo(
    () => (labels ?? []).map((label) => label.id),
    [labels]
  );

  const allLabelIds = useMemo(
    () => [...labelIds, UNLABELLED_LABEL_ID],
    [labelIds]
  );

  useEffect(() => {
    setMounted(true);
    setCurrentTime(Date.now());
  }, []);

  useEffect(() => {
    if (!apiTasks) return;
    setBoardTasks(apiTasks.tasks);
  }, [apiTasks, isFetching]);

  useEffect(() => {
    const sprintParam = searchParams.get("sprint");

    if (!sprintParam) {
      setSelectedSprintId(null);
      return;
    }

    if (sprints.length === 0) {
      setSelectedSprintId(sprintParam);
      return;
    }

    const exists = sprints.some((sprint) => sprint.id === sprintParam);
    setSelectedSprintId(exists ? sprintParam : null);
  }, [searchParams, sprints]);

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
    const labelSet = new Set(selectedLabelIds);
    const memberFiltersReady = (members?.length ?? 0) > 0;
    const epicFiltersReady = epics !== undefined;
    const labelFiltersReady = labels !== undefined;

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

      const matchesLabels =
        !labelFiltersReady && selectedLabelIds.length === 0
          ? true
          : task.labels.some((label) => labelSet.has(label.id)) ||
            (task.labels.length === 0 && labelSet.has(UNLABELLED_LABEL_ID));

      const matchesSprint =
        selectedSprintIds.length === 0 ||
        selectedSprintIds.includes(task.sprint?.id ?? "");

      return (
        matchesSearch &&
        matchesSprint &&
        prioritySet.has(task.priority) &&
        matchesAssignee &&
        matchesReporter &&
        matchesEpic &&
        matchesLabels
      );
    });
  }, [
    boardTasks,
    search,
    selectedPriorities,
    selectedAssigneeIds,
    selectedReporterIds,
    selectedEpicIds,
    selectedLabelIds,
    members,
    epics,
    labels,
    selectedSprintIds,
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
    return filteredTasks.filter((task) =>
      selectedStatuses.includes(task.status)
    ).length;
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

  const epicSummaries = useMemo<EpicSummary[]>(() => {
    return (epics ?? []).map((epic) => {
      const epicTasks = boardTasks.filter((task) => task.epic?.id === epic.id);

      const doneTasks = epicTasks.filter(
        (task) => task.status === TaskStatus.Done
      ).length;

      const totalTasks = epicTasks.length;
      const progress =
        totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

      const dueDate = epic.dueDate ?? null;
      const isOverdue =
        dueDate &&
        DateTime.fromISO(dueDate) < DateTime.now().startOf("day") &&
        progress < 100;

      let health: EpicSummary["health"] = "Healthy";

      if (progress === 100 && totalTasks > 0) {
        health = "Completed";
      } else if (isOverdue) {
        health = "Off track";
      } else if (
        dueDate &&
        DateTime.fromISO(dueDate) <= DateTime.now().plus({ days: 3 }) &&
        progress < 100
      ) {
        health = "At risk";
      }

      let dateTimeStr = "";

      if (epic.startDate) {
        dateTimeStr = DateTime.fromJSDate(epic.startDate).toLocaleString();
      }

      return {
        id: epic.id,
        title: epic.title,
        color: epic.color,
        startDate: dateTimeStr,
        dueDate,
        totalTasks,
        doneTasks,
        progress,
        health,
      };
    });
  }, [epics, boardTasks]);

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (search.trim()) count += 1;
    if (selectedSprintId) count += 1;
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

    if (hasInitializedLabels && !isSameSet(selectedLabelIds, allLabelIds)) {
      count += 1;
    }

    return count;
  }, [
    search,
    selectedSprintId,
    hasInitializedMembers,
    hasInitializedEpics,
    hasInitializedLabels,
    allAssigneeIds,
    memberIds,
    allEpicIds,
    allLabelIds,
    selectedStatuses,
    selectedPriorities,
    selectedAssigneeIds,
    selectedReporterIds,
    selectedEpicIds,
    selectedLabelIds,
  ]);

  const resetBoardFilters = () => {
    setSearch("");
    setSelectedSprintId(null);
    setSelectedStatuses([...allStatuses]);
    setSelectedPriorities([...allPriorities]);
    setSelectedAssigneeIds([...allAssigneeIds]);
    setSelectedReporterIds([...memberIds]);
    setSelectedEpicIds([...allEpicIds]);
    setSelectedLabelIds([...allLabelIds]);
  };

  const appliedFilterChips = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    const memberById = new Map(
      (members ?? []).map((member) => [
        member.id,
        member.fullName || member.username || member.email,
      ])
    );
    const epicById = new Map(
      (epics ?? []).map((epic) => [epic.id, epic.title])
    );
    const labelById = new Map(
      (labels ?? []).map((label) => [label.id, label.name])
    );
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

    if (selectedSprintId) {
      const sprintName =
        sprints.find((sprint) => sprint.id === selectedSprintId)?.name ??
        "Unknown sprint";

      chips.push({
        key: "sprint",
        label: `Sprint: ${sprintName}`,
        onRemove: () => setSelectedSprintId(null),
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
      const epicSummary = summarize(selectedEpicIds, allEpicIds, (epicId) =>
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

    if (hasInitializedLabels) {
      const labelSummary = summarize(
        selectedLabelIds,
        allLabelIds,
        (labelId) =>
          labelId === UNLABELLED_LABEL_ID
            ? "Unlabelled"
            : labelById.get(labelId) ?? "Unknown label"
      );
      if (labelSummary) {
        chips.push({
          key: "label",
          label: `Label: ${labelSummary}`,
          onRemove: () => setSelectedLabelIds([...allLabelIds]),
        });
      }
    }

    return chips;
  }, [
    search,
    members,
    epics,
    labels,
    sprints,
    selectedSprintId,
    selectedStatuses,
    selectedPriorities,
    selectedAssigneeIds,
    selectedReporterIds,
    selectedEpicIds,
    selectedLabelIds,
    hasInitializedMembers,
    hasInitializedEpics,
    hasInitializedLabels,
    allAssigneeIds,
    memberIds,
    allEpicIds,
    allLabelIds,
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
    const task = boardTasks.find((ele) => ele.id === taskId);

    if (!task) return;

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
        labelIds: task.labels.map((ele) => ele.id),
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
  }, [members, searchParams, allAssigneeIds, memberIds, hasInitializedMembers]);

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
    if (!labels) return;

    const labelParams = parseQueryList(searchParams.get("label"));
    const validLabelIds = new Set(allLabelIds);

    if (!hasInitializedLabels) {
      setSelectedLabelIds(
        labelParams === null
          ? [...allLabelIds]
          : labelParams.filter((id) => validLabelIds.has(id))
      );
      setHasInitializedLabels(true);
      return;
    }

    setSelectedLabelIds((current) =>
      current.filter((id) => validLabelIds.has(id))
    );
  }, [labels, searchParams, allLabelIds, hasInitializedLabels]);

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
      "sprint",
      selectedSprintIds.length > 0 ? selectedSprintIds.join(",") : null
    );

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

    if (hasInitializedLabels) {
      setOrDelete(
        "label",
        serializeFilterSelection(selectedLabelIds, allLabelIds)
      );
    }

    if (params.toString() !== searchParams.toString()) {
      router.replace(buildBoardUrl(params), { scroll: false });
    }
  }, [
    search,
    searchParams,
    router,
    selectedSprintIds,
    selectedStatuses,
    selectedPriorities,
    selectedAssigneeIds,
    selectedReporterIds,
    selectedEpicIds,
    selectedLabelIds,
    hasInitializedMembers,
    hasInitializedEpics,
    hasInitializedLabels,
    allAssigneeIds,
    memberIds,
    allEpicIds,
    allLabelIds,
  ]);

  useEffect(() => {
    if (selectedTask) {
      openModal({
        title: "Task details",
        showHeader: false,
        modalContent: (
          <TaskDetailsModal
            labels={labels || []}
            sprints={sprints}
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

  useEffect(() => {
    if (action === "create" && canCreateTask) {
      openModal({
        title: "Create new task",
        modalContent: (
          <CreateTaskModal
            defaultStatus={"Backlog"}
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

      router.push(`/${workspaceSlug}/projects/${projectSlug}/board`);
    }
  }, [action, canCreateTask]);

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
            {selectedSprint ? ` · ${selectedSprint.name}` : ""}
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

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-xs">
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <div className="min-w-87 flex-1 xl:max-w-md">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search title, ID, assignee..."
                className="w-full"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Popover
                position="left"
                onClose={() => setIsFilterOpen(false)}
                isOpen={isFilterOpen}
                content={
                  <BoardFilters
                    labels={labels}
                    selectedLabelIds={selectedLabelIds}
                    onSelectAllLabels={() =>
                      setSelectedLabelIds([...allLabelIds])
                    }
                    onClearLabels={() => setSelectedLabelIds([])}
                    onLabelClicked={(labelId) => {
                      setSelectedLabelIds((curr) =>
                        curr.includes(labelId)
                          ? curr.filter((item) => item !== labelId)
                          : [...curr, labelId]
                      );
                    }}
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
                    sprints={sprints}
                    selectedSprintIds={selectedSprintIds}
                    onSelectAllSprints={() =>
                      setSelectedSprintIds(sprints.map((s) => s.id))
                    }
                    onClearSprints={() => setSelectedSprintIds([])}
                    onSprintClicked={(sprintId) => {
                      setSelectedSprintIds((curr) =>
                        curr.includes(sprintId)
                          ? curr.filter((id) => id !== sprintId)
                          : [...curr, sprintId]
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
          </div>
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
