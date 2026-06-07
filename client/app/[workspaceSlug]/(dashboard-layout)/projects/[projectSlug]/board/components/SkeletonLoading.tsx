import { Search, SlidersHorizontal } from "lucide-react";
import { TaskStatus } from "@/shared/types/enums";
import { taskStatusConfig } from "@/shared/styles/classNames";

const skeletonClass = "animate-pulse rounded-md bg-[var(--border)]";

const columns = [
  { key: TaskStatus.Backlog, title: "Backlog", cards: 3 },
  { key: TaskStatus.Todo, title: "To do", cards: 4 },
  { key: TaskStatus.In_Progress, title: "In progress", cards: 3 },
  { key: TaskStatus.Review, title: "Review", cards: 2 },
  { key: TaskStatus.Done, title: "Done", cards: 3 },
  { key: TaskStatus.Canceled, title: "Canceled", cards: 1 },
] as const;

export default function SkeletonLoading() {
  return (
    <div className="flex h-full flex-col gap-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-9 w-full max-w-sm items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[var(--text-secondary)]">
          <Search className="h-4 w-4" />
          <div className={`h-3 w-28 ${skeletonClass}`} />
        </div>

        <div className="flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[var(--text-secondary)] shadow-xs">
          <SlidersHorizontal className="h-4 w-4" />
          <div className={`h-3 w-12 ${skeletonClass}`} />
          <div className={`h-5 w-9 rounded-full ${skeletonClass}`} />
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-x-auto overflow-y-hidden pb-4">
        {columns.map((column) => {
          const statusStyle = taskStatusConfig[column.key];

          return (
            <section
              key={column.key}
              className="min-h-[560px] w-[320px] min-w-[320px] shrink-0 overflow-hidden rounded-2xl border border-[var(--border)] p-3 shadow-sm"
              style={{
                background: `color-mix(in srgb, ${statusStyle.bg} 12%, var(--background))`,
              }}
            >
              <div
                className="mb-3 h-1 rounded-full"
                style={{ background: statusStyle.bg }}
              />

              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ background: statusStyle.bg }}
                  />
                  <div className={`h-4 w-20 ${skeletonClass}`} />
                  <div
                    className="h-5 w-8 animate-pulse rounded-full"
                    style={{ background: statusStyle.bg }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex h-10 w-full items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)]">
                  <div className={`h-3 w-20 ${skeletonClass}`} />
                </div>

                {Array.from({ length: column.cards }).map((_, index) => (
                  <TaskCardSkeleton key={`${column.key}-${index}`} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function TaskCardSkeleton() {
  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className={`h-4 w-11/12 ${skeletonClass}`} />
          <div className={`h-4 w-7/12 ${skeletonClass}`} />
        </div>

        <div className={`h-6 w-6 rounded-md ${skeletonClass}`} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={`h-3.5 w-3.5 rounded-full ${skeletonClass}`} />
          <div className={`h-3 w-20 ${skeletonClass}`} />
        </div>

        <div className="flex items-center gap-2">
          <div className={`h-6 w-14 rounded-full ${skeletonClass}`} />
          <div className={`h-7 w-7 rounded-full ${skeletonClass}`} />
        </div>
      </div>
    </article>
  );
}
