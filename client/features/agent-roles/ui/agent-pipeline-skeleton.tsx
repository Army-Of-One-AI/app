import { Skeleton } from "@/shared/ui/components";

export function AgentPipelineSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading pipeline"
      className="h-full min-h-[calc(100vh-112px)] overflow-auto bg-[#F7F8FC]"
    >
      <div className="border-b border-[#E5E7EB] bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-3 w-80 max-w-full" />
          </div>
          <Skeleton className="h-8 w-48 rounded-full" />
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-3 px-6 py-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="grid gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm md:grid-cols-[48px_1fr_auto]">
            <div>
              <Skeleton className="h-10 w-10" />
              {index < 5 ? <Skeleton className="ml-5 mt-2 hidden h-12 w-px rounded-none md:block" /> : null}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-36 rounded-full" />
                {index > 0 ? <Skeleton className="h-6 w-20 rounded-full" /> : null}
              </div>
              <Skeleton className="mt-3 h-4 w-full max-w-xl" />
              <Skeleton className="mt-2 h-4 w-2/3 max-w-md" />
              {index > 0 ? <Skeleton className="mt-3 h-3 w-48" /> : null}
            </div>
            <div className="flex items-center md:justify-end">
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
