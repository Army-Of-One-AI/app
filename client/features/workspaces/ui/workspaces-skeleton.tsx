import { Skeleton } from "@/shared/ui/components";

export function WorkspacesSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading workspaces"
      className="grid gap-3"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-2 h-4 w-28" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-16" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
