/* eslint-disable @next/next/no-img-element */
"use client";

import { UserRound } from "lucide-react";
import { useMemo } from "react";

type AssigneeWorkload = {
  id: string;
  fullName: string;
  username: string;
  avatarURL: string;
  tasksCount: number;
};

export default function AssigneeWorkloadChart({
  assignees,
  onAssigneeClick,
}: {
  assignees: AssigneeWorkload[];
  onAssigneeClick?: (assigneeId: string) => void;
}) {
  const data = useMemo(
    () =>
      [...assignees]
        .map((assignee) => {
          const displayName =
            assignee.fullName === "__unassigned"
              ? "Unassigned"
              : assignee.fullName || assignee.username || "Unassigned";

          return {
            ...assignee,
            displayName,
            avatarURL:
              assignee.fullName === "__unassigned" ? "" : assignee.avatarURL,
          };
        })
        .sort((a, b) => b.tasksCount - a.tasksCount),
    [assignees]
  );

  const maxTasks = Math.max(...data.map((assignee) => assignee.tasksCount), 0);
  const totalTasks = data.reduce(
    (sum, assignee) => sum + Number(assignee.tasksCount || 0),
    0
  );

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Workload by assignee
          </h3>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Task ownership across the project team.
          </p>
        </div>

        <div className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-semibold text-[var(--text-primary)]">
          {totalTasks} tasks
        </div>
      </div>

      <div className="mt-5">
        {data.length > 0 ? (
          <div className="space-y-4">
            {data.map((assignee) => {
              const percent =
                maxTasks > 0
                  ? Math.round((assignee.tasksCount / maxTasks) * 100)
                  : 0;

              return (
                <button
                  type="button"
                  key={assignee.id || assignee.displayName}
                  onClick={() => onAssigneeClick?.(assignee.id)}
                  className="block w-full space-y-2 rounded-xl p-2 text-left transition hover:bg-[var(--secondary)]"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_72px] items-center gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {assignee.avatarURL ? (
                        <img
                          src={assignee.avatarURL}
                          alt={assignee.displayName}
                          className="h-8 w-8 shrink-0 rounded-full border border-[var(--border)] object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-secondary)]">
                          <UserRound className="h-4 w-4" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                          {assignee.displayName}
                        </p>
                        {assignee.username &&
                        assignee.displayName !== "Unassigned" ? (
                          <p className="truncate text-xs text-[var(--text-secondary)]">
                            @{assignee.username}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <span className="text-right text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                      {assignee.tasksCount}{" "}
                      <span className="font-medium text-[var(--text-secondary)]">
                        {assignee.tasksCount === 1 ? "task" : "tasks"}
                      </span>
                    </span>
                  </div>

                  <div className="ml-11 h-2 overflow-hidden rounded-full bg-[var(--secondary)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-700 ease-out"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--border)] py-10 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--text-secondary)]">
              <UserRound className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
              No workload data
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Assigned tasks will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
