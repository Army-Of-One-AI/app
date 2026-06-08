const skeletonClass = "animate-pulse rounded-md bg-[var(--border)]";

export default function ProjectsSkeleton() {
  return (
    <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className={`${skeletonClass} h-6 w-24 rounded-full`} />
              <div className={`${skeletonClass} h-5 w-2/3`} />
              <div className={`${skeletonClass} h-3 w-1/2`} />
            </div>
            <div className={`${skeletonClass} size-9 rounded-xl`} />
          </div>
          <div className={`${skeletonClass} mt-5 h-4 w-full`} />
          <div className={`${skeletonClass} mt-3 h-4 w-5/6`} />
          <div className="mt-5 grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((__, statIndex) => (
              <div
                key={statIndex}
                className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3"
              >
                <div className={`${skeletonClass} h-4 w-10`} />
                <div className={`${skeletonClass} mt-2 h-3 w-16`} />
              </div>
            ))}
          </div>
          <div className={`${skeletonClass} mt-6 h-10 w-full rounded-xl`} />
        </div>
      ))}
    </section>
  );
}
