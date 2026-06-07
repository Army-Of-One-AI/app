import { taskStatusConfig } from "@/shared/styles/classNames";
import { TaskStatus } from "@/shared/types/enums";

export default function StatusLegendRow({
  status,
  count,
  percent,
}: {
  status: TaskStatus;
  count: number;
  percent: number;
}) {
  const config = taskStatusConfig[status];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_88px_52px] items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-[var(--secondary)]">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: config.text }}
        />
        <span className="truncate text-sm font-medium text-[var(--text-primary)]">
          {config.label}
        </span>
      </div>

      <span className="text-right text-sm font-semibold tabular-nums text-[var(--text-primary)]">
        {count} {count === 1 ? "task" : "tasks"}
      </span>

      <span className="text-right text-sm tabular-nums text-[var(--text-secondary)]">
        {percent}%
      </span>
    </div>
  );
}
