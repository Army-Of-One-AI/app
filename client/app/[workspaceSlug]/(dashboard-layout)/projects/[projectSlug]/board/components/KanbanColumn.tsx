import { CircleDot, Plus } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { Task } from "@/features/tasks/types";
import { useDroppable } from "@dnd-kit/core";
import { taskStatusConfig } from "@/shared/styles/classNames";
import { CSSProperties } from "react";
import { BoardStatus } from "../page";

export default function KanbanColumn({
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
      className="
        relative
        min-h-[560px]
        w-[320px]
        min-w-[320px]
        shrink-0
        overflow-y-auto
        rounded-xl
        border
        p-3 shadow-sm
        transition
        duration-200
      "
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
        {canCreateTask && (
          <button
            type="button"
            onClick={() => onCreateTask(id)}
            className="sticky -top-3 z-10 flex h-10 w-full cursor-pointer items-center justify-center
            gap-2 rounded-xl border border-dashed bg-[var(--background)] shadow-2xl
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
