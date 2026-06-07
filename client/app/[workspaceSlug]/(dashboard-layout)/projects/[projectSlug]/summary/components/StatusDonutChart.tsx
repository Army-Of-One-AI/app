"use client";

import { useMemo } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  TooltipContentProps,
} from "recharts";
import { TASK_STATUS_ORDER, TaskStatus } from "@/shared/types/enums";
import { taskStatusConfig } from "@/shared/styles/classNames";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

const COLORS: Record<TaskStatus, string> = {
  Backlog: taskStatusConfig.Backlog.text,
  Todo: taskStatusConfig.Todo.text,
  In_Progress: taskStatusConfig.In_Progress.text,
  Review: taskStatusConfig.Review.text,
  Done: taskStatusConfig.Done.text,
  Canceled: taskStatusConfig.Canceled.text,
};

export default function StatusDonutChart({
  statusCounts,
  totalTasks,
}: {
  statusCounts: Record<TaskStatus, number>;
  totalTasks: number;
}) {
  const data = useMemo(
    () =>
      TASK_STATUS_ORDER.map((status) => ({
        name: status,
        label: taskStatusConfig[status].label,
        value: Number(statusCounts[status] || 0),
        color: COLORS[status],
      })).filter((item) => item.value > 0),
    [statusCounts]
  );

  return (
    <div className="flex items-center justify-center">
      <div className="relative h-[220px] w-[220px]">
        <div className="relative z-20 h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                cursor={false}
                wrapperStyle={{
                  zIndex: 50,
                  pointerEvents: "none",
                }}
                content={(props) => (
                  <StatusTooltip {...props} totalTasks={totalTasks} />
                )}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={78}
                outerRadius={96}
                paddingAngle={0}
                cornerRadius={0}
                startAngle={90}
                endAngle={-270}
                isAnimationActive
                animationBegin={120}
                animationDuration={900}
                animationEasing="ease-out"
                stroke="none"
              >
                {data.map((item) => (
                  <Cell
                    key={item.name}
                    fill={item.color}
                    className="cursor-pointer outline-none transition-opacity duration-200 hover:opacity-80"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-8 z-10 flex flex-col items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] shadow-inner">
            <p className="text-4xl font-semibold text-[var(--text-primary)]">
              {totalTasks}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              Total tasks
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

type ChartItem = {
  name: TaskStatus;
  label: string;
  value: number;
  color: string;
};

function StatusTooltip({
  active,
  payload,
  totalTasks,
}: TooltipContentProps<ValueType, NameType> & {
  totalTasks: number;
}) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload as ChartItem;

  const percentage =
    totalTasks > 0 ? Math.round((item.value / totalTasks) * 100) : 0;

  return (
    <div className="rounded-xl w-40 border border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-xl z-999">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: item.color }}
        />

        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {item.label}
        </p>
      </div>

      <p className="mt-1 text-xs text-[var(--text-secondary)]">
        {item.value} tasks · {percentage}%
      </p>
    </div>
  );
}
