"use client";

import { toast, ToastContainer } from "react-toastify";
import useTasksByProjectSlug from "@/features/tasks/hooks/useTasksByProjectSlug";
import { Task } from "@/features/tasks/types";
import { TaskStatus } from "@/shared/types/enums";
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
  GripVertical,
  Plus,
  Search,
} from "lucide-react";
import { useParams } from "next/navigation";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import CreateTaskModal from "./components/CreateTaskModal";
import useModal from "@/shared/hooks/useModal";
import TaskDetailsModal from "./components/TaskDetailsModal";

const columns = [
  { key: TaskStatus.Todo, title: "To do" },
  { key: TaskStatus.In_Progress, title: "In progress" },
  { key: TaskStatus.Review, title: "Review" },
  { key: TaskStatus.Done, title: "Done" },
] as const;

type BoardStatus = (typeof columns)[number]["key"];

export default function ProjectBoardPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const projectSlug = params.projectSlug as string;

  const { openModal, closeModal } = useModal();

  const {
    data: apiTasks,
    isLoading,
    error,
  } = useTasksByProjectSlug(projectSlug, workspaceSlug);

  const createTaskMutation = useCreateTask(workspaceSlug, projectSlug);

  const [mounted, setMounted] = useState(false);
  const [boardTasks, setBoardTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState("");

  const canCreateTask =
    apiTasks?.currentUser.permissions.task.canCreateTask ?? false;

  const canUpdateTaskStatus =
    apiTasks?.currentUser.permissions.task.canUpdateTaskStatus ?? false;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!apiTasks) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBoardTasks(apiTasks.tasks);
  }, [apiTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 2,
      },
    })
  );

  const filteredTasks = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return boardTasks;

    return boardTasks.filter(
      (task) =>
        task.title.toLowerCase().includes(keyword) ||
        task.id.toLowerCase().includes(keyword) ||
        task.assignee?.fullName?.toLowerCase().includes(keyword)
    );
  }, [boardTasks, search]);

  const tasksByStatus = useMemo(() => {
    return columns.reduce<Record<BoardStatus, Task[]>>(
      (acc, column) => {
        acc[column.key] = filteredTasks
          .filter((task) => task.status === column.key)
          .sort((a, b) => a.position - b.position);

        return acc;
      },
      {
        [TaskStatus.Todo]: [],
        [TaskStatus.In_Progress]: [],
        [TaskStatus.Review]: [],
        [TaskStatus.Done]: [],
      }
    );
  }, [filteredTasks]);

  const handleDragEnd = (event: DragEndEvent) => {
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

    // TODO: call update task status API here
  };

  const handleOpenTaskDetails = (task: Task) => {
    openModal({
      title: "Task details",
      modalContent: (
        <TaskDetailsModal
          task={task}
          canUpdateTask={
            apiTasks?.currentUser.permissions.task.canUpdateTask ?? false
          }
          canAssignTask={
            apiTasks?.currentUser.permissions.task.canAssignTask ?? false
          }
          onClose={closeModal}
          onUpdate={(updatedTask) => {
            setBoardTasks((curr) =>
              curr.map((t) => (t.id === updatedTask.id ? updatedTask : t))
            );

            closeModal();
          }}
        />
      ),
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[var(--text-secondary)]">
        Loading tasks...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-red-500">
        Failed to load tasks.
      </div>
    );
  }

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

  return (
    <div className="flex h-full flex-col gap-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
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

        <p className="text-sm text-[var(--text-secondary)]">
          {filteredTasks.length} tasks
        </p>
      </div>

      {mounted ? (
        <DndContext
          sensors={sensors}
          onDragEnd={canUpdateTaskStatus ? handleDragEnd : undefined}
        >
          <BoardColumns
            canCreateTask={canCreateTask}
            tasksByStatus={tasksByStatus}
            canUpdateTaskStatus={canUpdateTaskStatus}
            onCreateTask={handleOpenCreateTaskModal}
            onOpenTaskDetails={handleOpenTaskDetails}
          />
        </DndContext>
      ) : (
        <BoardColumns
          canCreateTask={canCreateTask}
          tasksByStatus={tasksByStatus}
          disabled
          canUpdateTaskStatus={canUpdateTaskStatus}
          onCreateTask={handleOpenCreateTaskModal}
          onOpenTaskDetails={handleOpenTaskDetails}
        />
      )}
    </div>
  );
}

function BoardColumns({
  tasksByStatus,
  disabled = false,
  onCreateTask,
  canCreateTask,
  canUpdateTaskStatus,
  onOpenTaskDetails,
}: {
  tasksByStatus: Record<BoardStatus, Task[]>;
  disabled?: boolean;
  onCreateTask: (status: BoardStatus) => void;
  canCreateTask: boolean;
  canUpdateTaskStatus: boolean;
  onOpenTaskDetails: (task: Task) => void;
}) {
  return (
    <div className="grid flex-1 grid-cols-1 gap-4 overflow-x-auto pb-4 md:grid-cols-2 xl:grid-cols-4">
      {columns.map((column) => (
        <KanbanColumn
          key={column.key}
          id={column.key}
          title={column.title}
          tasks={tasksByStatus[column.key]}
          disabled={disabled}
          canUpdateTaskStatus={canUpdateTaskStatus}
          canCreateTask={canCreateTask}
          onCreateTask={onCreateTask}
          onOpenTaskDetails={onOpenTaskDetails}
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
}: {
  id: BoardStatus;
  title: string;
  tasks: Task[];
  canCreateTask: boolean;
  disabled?: boolean;
  onCreateTask: (status: BoardStatus) => void;
  canUpdateTaskStatus: boolean;
  onOpenTaskDetails: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled: disabled || !canUpdateTaskStatus,
  });

  return (
    <section
      ref={setNodeRef}
      className={`min-h-[560px] rounded-2xl border p-3 transition ${
        isOver
          ? "border-[var(--primary)] bg-[var(--primary)]/10"
          : "border-[var(--border)] bg-[var(--secondary)]/60"
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <CircleDot size={14} className="text-[var(--primary)]" />

          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {title}
          </h2>

          <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard
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
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--primary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
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
  canUpdateTaskStatus,
  onOpenTaskDetails,
}: {
  task: Task;
  disabled?: boolean;
  canUpdateTaskStatus: boolean;
  onOpenTaskDetails: (task: Task) => void;
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
    <article
      onDoubleClick={() => onOpenTaskDetails(task)}
      onPointerDown={(e) => {
        e.stopPropagation();

        if (!canUpdateTaskStatus) {
          handleDragAttempt();
        }
      }}
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs cursor-pointer ${
        isDragging
          ? "scale-[1.02] opacity-80 shadow-lg"
          : "transition-shadow hover:shadow-sm"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold text-[var(--text-secondary)]">
            {task.id}
          </p>

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

          <div
            title={task.assignee?.fullName ?? "Unassigned"}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-[var(--text-primary)]"
          >
            {assigneeInitial}
          </div>
        </div>
      </div>
      <ToastContainer />
    </article>
  );
}

function PriorityBadge({ priority }: { priority: Task["priority"] }) {
  const className = {
    Low: "bg-emerald-50 text-emerald-700",
    Medium: "bg-amber-50 text-amber-700",
    High: "bg-red-50 text-red-700",
    Urgent: "bg-red-100 text-red-800",
  }[priority];

  return (
    <span
      className={`rounded-full px-2 py-1 text-[11px] font-semibold ${className}`}
    >
      {priority}
    </span>
  );
}
