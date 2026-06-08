import { Task } from "@/features/tasks/types";
import { GitBranch, Layers3, TimerReset } from "lucide-react";

export default function TaskRelationBadges({ task }: { task: Task }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5">
      {task.sprint && (
        <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">
          <TimerReset size={12} />
          <span className="truncate">{task.sprint.name}</span>
        </div>
      )}

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
              className="text-[10px] font-black uppercase tracking-wider"
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
