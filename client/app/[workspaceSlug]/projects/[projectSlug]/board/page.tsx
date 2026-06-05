/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { toast, ToastContainer } from "react-toastify";
import useTasksByProjectSlug from "@/features/tasks/hooks/useTasksByProjectSlug";
import { Task } from "@/features/tasks/types";
import { TaskPriority, TaskStatus } from "@/shared/types/enums";
import useCreateTask from "@/features/tasks/hooks/useCreateTask";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  CalendarDays,
  CircleDot,
  Filter,
  GripVertical,
  Plus,
  Search,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
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
import BoardFilters, { UNASSIGNED_MEMBER_ID } from "./components/BoardFilters";

const columns = [
  { key: TaskStatus.Backlog, title: "Backlog" },
  { key: TaskStatus.Todo, title: "To do" },
  { key: TaskStatus.In_Progress, title: "In progress" },
  { key: TaskStatus.Review, title: "Review" },
  { key: TaskStatus.Done, title: "Done" },
  { key: TaskStatus.Canceled, title: "Canceled" },
] as const;

type BoardStatus = (typeof columns)[number]["key"];
type BoardColumn = (typeof columns)[number];

export default function ProjectBoardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams();
  const searchParams = useSearchParams();
  const selectedTask = searchParams.get("selectedTask");

  const [refetchingTaskIds, setRefetchingTaskIds] = useState<string[]>([]);

  const workspaceSlug = params.workspaceSlug as string;
  const projectSlug = params.projectSlug as string;

  const { data: members } = useGetProjectMembers(projectSlug, workspaceSlug);
  const { openModal, closeModal, isOpen: isOpenModal } = useModal();

  const {
    data: apiTasks,
    isLoading,
    isFetching,
    error,
  } = useTasksByProjectSlug(projectSlug, workspaceSlug);

  const createTaskMutation = useCreateTask(workspaceSlug, projectSlug);
  const { mutateAsync: updateTask } = useUpdateTask();

  const [mounted, setMounted] = useState(false);
  const [boardTasks, setBoardTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>([...Object.values(TaskStatus)]);
  const [selectedPriorities, setSelectedPriorities] = useState<TaskPriority[]>([...Object.values(TaskPriority)]);
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([])
  const [selectedReporterIds, setSelectedReporterIds] = useState<string[]>([])

  const canCreateTask =
    apiTasks?.currentUser.permissions.task.canCreateTask ?? false;

  const canUpdateTaskStatus =
    apiTasks?.currentUser.permissions.task.canUpdateTaskStatus ?? false;

  useEffect(() => {
    setMounted(true);
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

    return boardTasks.filter((task) => {
      const matchesSearch =
        !keyword ||
        task.title.toLowerCase().includes(keyword) ||
        task.id.toLowerCase().includes(keyword) ||
        task.assignee?.fullName?.toLowerCase().includes(keyword) ||
        task.creator?.fullName?.toLowerCase().includes(keyword);

      const matchesAssignee =
        assigneeSet.has(task.assignee?.id ?? "") ||
        (!task.assignee && assigneeSet.has(UNASSIGNED_MEMBER_ID));

      const matchesReporter =
        reporterSet.has(task.creator?.id ?? "")

      return (
        matchesSearch &&
        prioritySet.has(task.priority) &&
        matchesAssignee &&
        matchesReporter
      );
    });
  }, [
    boardTasks,
    search,
    selectedPriorities,
    selectedAssigneeIds,
    selectedReporterIds,
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

  const handleDragEnd = async (event: DragEndEvent) => {
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
    router.push(
      `/${workspaceSlug}/projects/${projectSlug}/board?selectedTask=${taskId}`
    );
  };

  const handleOpenCreateTaskModal = (status: BoardStatus = TaskStatus.Todo) => {
    if (!canCreateTask) return;

    openModal({
      title: "Create new task",
      modalContent: (
        <CreateTaskModal
          defaultStatus={status}
          isLoading={createTaskMutation.isPending}
          onClose={closeModal}
          onCreate={async (values) => {
            const newTask = await createTaskMutation.mutateAsync(values);

            setBoardTasks((curr) => [...curr, newTask]);

            closeModal();
          }}
        />
      ),
    });
  };

  useEffect(() => {
    if (members && members.length > 0) {
      setSelectedAssigneeIds([...members.map(m => m.id), UNASSIGNED_MEMBER_ID])
      setSelectedReporterIds(members.map(m => m.id))
    }
  }, [members])

  useEffect(() => {
    if (selectedTask) {
      openModal({
        title: "Task details",
        showHeader: false,
        modalContent: (
          <TaskDetailsModal
            members={members ?? []}
            taskId={selectedTask}
            canUpdateTask={
              apiTasks?.currentUser.permissions.task.canUpdateTask ?? false
            }
            canAssignTask={
              apiTasks?.currentUser.permissions.task.canAssignTask ?? false
            }
            onClose={() => {
              router.push(`/${workspaceSlug}/projects/${projectSlug}/board`);
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
    if (!isOpenModal) {
      router.push(`/${workspaceSlug}/projects/${projectSlug}/board`);
    }
  }, [isOpenModal]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[var(--text-secondary)]">
        Loading tasks...
      </div>
    );
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
    <div className="flex h-full flex-col gap-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--primary)]"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Popover
              position="left"
              onClose={() => setIsFilterOpen(false)}
              isOpen={isFilterOpen}
              content={<BoardFilters
                members={members || []}
                selectedPriorities={selectedPriorities}
                onPriorityClicked={(priority) => {
                  setSelectedPriorities((curr) =>
                    curr.includes(priority)
                      ? curr.filter((item) => item !== priority)
                      : [...curr, priority]
                  );
                }}
                selectedStatuses={selectedStatuses}
                onStatusClicked={(status) => {
                  setSelectedStatuses((curr) =>
                    curr.includes(status)
                      ? curr.filter((item) => item !== status)
                      : [...curr, status]
                  );
                }}

                selectedAssigneeIds={selectedAssigneeIds}
                onAssigneeClicked={(memberId) => {
                  setSelectedAssigneeIds((curr) =>
                    curr.includes(memberId)
                      ? curr.filter((item) => item !== memberId)
                      : [...curr, memberId]
                  );
                }}

                selectedReporterIds={selectedReporterIds}
                onReporterClicked={(memberId) => {
                  setSelectedReporterIds((curr) =>
                    curr.includes(memberId)
                      ? curr.filter((item) => item !== memberId)
                      : [...curr, memberId]
                  );
                }}
              />}>
              <button
                type="button"
                onClick={() => setIsFilterOpen((curr) => !curr)}
                className="flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-medium text-[var(--text-primary)] shadow-xs transition hover:bg-[var(--secondary)]"
              >
                <Filter size={15} />
                Filter
                <span className="rounded-full bg-[var(--secondary)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                  {selectedStatuses.length}/{columns.length}
                </span>
              </button>
            </Popover>
          </div>
        </div>
      </div>

      {visibleColumns.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[var(--border)] text-sm text-[var(--text-secondary)]">
          No columns selected.
        </div>
      ) : mounted ? (
        <DndContext
          sensors={sensors}
          onDragEnd={canUpdateTaskStatus ? handleDragEnd : undefined}
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
    borderColor: statusStyle.bg,
    background: isOver
      ? `color-mix(in srgb, ${statusStyle.bg} 34%, var(--background))`
      : `color-mix(in srgb, ${statusStyle.bg} 12%, var(--background))`,
    boxShadow: isOver
      ? `0 0 0 3px color-mix(in srgb, ${statusStyle.bg} 72%, transparent), 0 18px 44px color-mix(in srgb, ${statusStyle.bg} 28%, transparent)`
      : undefined,
    transform: isOver ? "translateY(-2px)" : undefined,
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
        rounded-2xl
        border
        p-3
        relative
        overflow-hidden
        transition
        duration-200
      `}
    >
      {isOver && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
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
            className="rounded-full px-2 py-0.5 text-xs font-medium"
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

        {canCreateTask && (
          <button
            type="button"
            onClick={() => onCreateTask(id)}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
            style={{ borderColor: statusStyle.bg }}
          >
            <Plus size={15} />
            Add task
          </button>
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
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      disabled,
    });

  const style: CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? "relative" : undefined,
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
    <div className="relative rounded-xl">
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
        cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs 
        ${isDragging
            ? "scale-[1.02] opacity-80 shadow-lg"
            : "transition-shadow hover:shadow-sm"
          }
      `}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
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
            ${canUpdateTaskStatus
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

            <div
              title={task.assignee?.fullName ?? "Unassigned"}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-[var(--ink)]"
            >
              {assigneeInitial}
            </div>
          </div>
        </div>
      </article>
    </div>
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
