import { Skeleton } from "@/shared/ui/components";

export function ProjectsSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading projects"
      className="grid gap-3"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-2 h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <Skeleton className="h-4 w-2/5 min-w-32" />
            <Skeleton className="mt-2 h-4 w-4/5" />
            <Skeleton className="mt-4 h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
