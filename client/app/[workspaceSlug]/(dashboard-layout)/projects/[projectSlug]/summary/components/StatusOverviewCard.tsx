import { TASK_STATUS_ORDER, TaskStatus } from "@/shared/types/enums";
import StatusDonutChart from "./StatusDonutChart";
import StatusLegendRow from "./StatusLegendRow";

export default function StatusOverviewCard({
  statusCounts,
  totalTasks,
  onStatusClick,
}: {
  statusCounts: Record<TaskStatus, number>;
  totalTasks: number;
  onStatusClick?: (status: TaskStatus) => void;
}) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Status overview
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Snapshot of current work items by status.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[240px_1fr]">
        <StatusDonutChart
          statusCounts={statusCounts}
          totalTasks={totalTasks}
          onStatusClick={onStatusClick}
        />

        <div className="flex flex-col justify-center gap-2.5">
          {TASK_STATUS_ORDER.map((status) => {
            const count = Number(statusCounts[status] || 0);
            const percent =
              totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;

            return (
              <StatusLegendRow
                key={status}
                status={status}
                count={count}
                percent={percent}
                onClick={() => onStatusClick?.(status)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
