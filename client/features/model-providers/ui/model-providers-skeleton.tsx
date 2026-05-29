import { Skeleton } from "@/shared/ui/components";

export function ModelProvidersSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading model providers"
      className="grid gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Skeleton className="h-4 w-36" />
              <Skeleton className="mt-3 h-4 w-44" />
              <Skeleton className="mt-2 h-3 w-64 max-w-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
