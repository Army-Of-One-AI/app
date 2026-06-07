"use client";

import { TaskPriority, taskPriorityConfig } from "@/shared/types/enums";
import { useMemo } from "react";

const PRIORITY_ORDER: TaskPriority[] = ["Urgent", "High", "Medium", "Low"];

export default function PriorityBreakdownChart({
  priorityCounts,
}: {
  priorityCounts: Partial<Record<TaskPriority, number>>;
}) {
  const { data, total } = useMemo(() => {
    const rows = PRIORITY_ORDER.map((priority) => {
      const count = Number(priorityCounts[priority] || 0);
      return {
        priority,
        label: taskPriorityConfig[priority].label,
        count,
        color: taskPriorityConfig[priority].text,
        background: taskPriorityConfig[priority].bg,
      };
    });

    return {
      data: rows,
      total: rows.reduce((sum, item) => sum + item.count, 0),
    };
  }, [priorityCounts]);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Priority breakdown
          </h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            How current work is distributed by urgency.
          </p>
        </div>

        <div className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-semibold text-[var(--text-primary)]">
          {total} tasks
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {data.map((item) => {
          const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;

          return (
            <div key={item.priority} className="space-y-2">
              <div className="grid grid-cols-[minmax(0,1fr)_70px_48px] items-center gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {item.label}
                  </span>
                </div>

                <span className="text-right text-sm font-semibold text-[var(--text-primary)]">
                  {item.count} {item.count === 1 ? "task" : "tasks"}
                </span>

                <span className="text-right text-sm tabular-nums text-[var(--text-secondary)]">
                  {percent}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-[var(--secondary)]">
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-out"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: item.color,
                    boxShadow:
                      percent > 0 ? `0 0 18px ${item.background}` : undefined,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
