"use client";

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

type TaskStatus = "Todo" | "InProgress" | "Review" | "Done";

type Task = {
  id: string;
  title: string;
  description?: string;
  assignee?: string;
  priority: "Low" | "Medium" | "High";
  dueDate?: string;
  status: TaskStatus;
};

const columns: { key: TaskStatus; title: string }[] = [
  { key: "Todo", title: "To do" },
  { key: "InProgress", title: "In progress" },
  { key: "Review", title: "Review" },
  { key: "Done", title: "Done" },
];

const initialTasks: Task[] = [
  {
    id: "AO-101",
    title: "Design project details drawer",
    description: "Create Jira-style right drawer for project information.",
    assignee: "HV",
    priority: "High",
    dueDate: "Jun 24",
    status: "Todo",
  },
  {
    id: "AO-102",
    title: "Create project API integration",
    assignee: "LV",
    priority: "Medium",
    dueDate: "Jun 26",
    status: "InProgress",
  },
  {
    id: "AO-103",
    title: "Improve rich text description UI",
    assignee: "AN",
    priority: "Medium",
    status: "Review",
  },
  {
    id: "AO-104",
    title: "Add workspace validation errors",
    assignee: "HV",
    priority: "Low",
    dueDate: "Jun 20",
    status: "Done",
  },
];

export default function ProjectBoardPage() {
  const params = useParams();
  const projectSlug = params.projectSlug as string;

  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 2,
      },
    })
  );

  const filteredTasks = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return tasks;

    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(keyword) ||
        task.id.toLowerCase().includes(keyword)
    );
  }, [tasks, search]);

  const tasksByStatus = useMemo(() => {
    return columns.reduce<Record<TaskStatus, Task[]>>(
      (acc, column) => {
        acc[column.key] = filteredTasks.filter(
          (task) => task.status === column.key
        );
        return acc;
      },
      {
        Todo: [],
        InProgress: [],
        Review: [],
        Done: [],
      }
    );
  }, [filteredTasks]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const taskId = String(active.id);
    const nextStatus = String(over.id) as TaskStatus;

    if (!columns.some((column) => column.key === nextStatus)) return;

    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: nextStatus,
            }
          : task
      )
    );
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
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <BoardColumns tasksByStatus={tasksByStatus} />
        </DndContext>
      ) : (
        <BoardColumns tasksByStatus={tasksByStatus} disabled />
      )}
    </div>
  );
}

function BoardColumns({
  tasksByStatus,
  disabled = false,
}: {
  tasksByStatus: Record<TaskStatus, Task[]>;
  disabled?: boolean;
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
}: {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  disabled?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled,
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
          <TaskCard key={task.id} task={task} disabled={disabled} />
        ))}

        <button
          type="button"
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--primary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
        >
          <Plus size={15} />
          Add task
        </button>
      </div>
    </section>
  );
}

function TaskCard({ task, disabled }: { task: Task; disabled?: boolean }) {
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

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs ${
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
          {...(!disabled ? listeners : {})}
          {...(!disabled ? attributes : {})}
          className="cursor-grab rounded-md p-1 text-[var(--text-secondary)] transition hover:bg-[var(--secondary)] active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </button>
      </div>

      {task.description && (
        <p className="mb-4 line-clamp-2 text-sm leading-5 text-[var(--text-secondary)]">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          {task.dueDate && (
            <>
              <CalendarDays size={14} />
              <span>{task.dueDate}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <PriorityBadge priority={task.priority} />

          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-[var(--text-primary)]">
            {task.assignee ?? "?"}
          </div>
        </div>
      </div>
    </article>
  );
}

function PriorityBadge({ priority }: { priority: Task["priority"] }) {
  const className = {
    Low: "bg-emerald-50 text-emerald-700",
    Medium: "bg-amber-50 text-amber-700",
    High: "bg-red-50 text-red-700",
  }[priority];

  return (
    <span
      className={`rounded-full px-2 py-1 text-[11px] font-semibold ${className}`}
    >
      {priority}
    </span>
  );
}
