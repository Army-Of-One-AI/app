import { CalendarDays, GripVertical } from "lucide-react";
import TaskRelationBadges from "./TaskRelationBadges";
import { taskPriorityColors } from "@/shared/styles/classNames";
import { Task } from "@/features/tasks/types";
import { CSSProperties } from "react";
import { useDraggable } from "@dnd-kit/core";
import { toast } from "react-toastify";

export function TaskCard({
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
                  className="h-7 w-7 rounded-full"
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

function PriorityBadge({ priority }: { priority: Task["priority"] }) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-[11px] font-semibold ${taskPriorityColors[priority]}`}
    >
      {priority}
    </span>
  );
}
