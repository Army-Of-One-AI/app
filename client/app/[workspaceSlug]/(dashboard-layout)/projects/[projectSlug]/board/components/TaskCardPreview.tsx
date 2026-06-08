import { CalendarDays, GripVertical } from "lucide-react";
import TaskRelationBadges from "./TaskRelationBadges";
import { Task } from "@/features/tasks/types";
import PriorityBadge from "./PriorityBadge";

export default function TaskCardPreview({ task }: { task: Task }) {
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
