import { Skeleton } from "@/shared/ui/components";

const columnTaskCounts = [4, 3, 5, 3, 4, 2];

export function BoardSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading board"
      className="h-full min-h-[calc(100vh-112px)] bg-[#F7F8FC] bg-[radial-gradient(#D1D5DB_1px,transparent_1px)] p-3 [background-size:18px_18px]"
    >
      <div className="h-[calc(100vh-132px)] min-h-[560px] overflow-hidden rounded-2xl border border-[#E5E7EB]/70 bg-white/35 p-4 shadow-inner">
        <div className="flex h-full min-w-max gap-4 pr-8">
          {columnTaskCounts.map((taskCount, columnIndex) => (
            <div
              key={columnIndex}
              className="flex h-full w-80 shrink-0 flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-9 rounded-full" />
              </div>
              <div className="grid content-start gap-3 p-3">
                {Array.from({ length: taskCount }).map((_, taskIndex) => (
                  <div key={taskIndex} className="rounded-2xl border border-[#E5E7EB] bg-white p-3">
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="mt-2 h-4 w-2/3" />
                    <div className="mt-3 flex gap-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <Skeleton className="h-5 w-20 rounded-full" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
