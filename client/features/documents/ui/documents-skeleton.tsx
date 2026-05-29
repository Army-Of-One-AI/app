import { Skeleton } from "@/shared/ui/components";

export function DocumentsSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading documents"
      className="grid gap-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-2 h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-2/5 min-w-40" />
                <Skeleton className="mt-2 h-3 w-3/5 min-w-56" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
