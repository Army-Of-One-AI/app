import { classNames } from "@/shared/styles/classNames";

const skeletonClass = "animate-pulse rounded-md bg-[var(--border)]";

export default function SkeletonLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-5 py-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={`rounded-2xl border ${classNames.border} ${classNames.surface} p-5`}
          >
            <div className={`mb-4 size-10 rounded-xl ${skeletonClass}`} />

            <div className="space-y-2">
              <div className={`h-8 w-20 ${skeletonClass}`} />
              <div className={`h-4 w-24 ${skeletonClass}`} />
              <div className={`h-3 w-20 ${skeletonClass}`} />
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div
          className={`rounded-2xl border ${classNames.border} ${classNames.surface} p-6`}
        >
          <div className={`mb-6 h-6 w-40 ${skeletonClass}`} />

          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index}>
                <div className="mb-2 flex items-center justify-between">
                  <div className={`h-4 w-24 ${skeletonClass}`} />
                  <div className={`h-4 w-10 ${skeletonClass}`} />
                </div>

                <div className={`h-2 w-full rounded-full ${skeletonClass}`} />
              </div>
            ))}
          </div>
        </div>

        <div
          className={`rounded-2xl border ${classNames.border} ${classNames.surface} p-6`}
        >
          <div className={`mb-6 h-6 w-40 ${skeletonClass}`} />

          <div className="space-y-4">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="flex gap-3">
                <div className={`size-10 rounded-full ${skeletonClass}`} />

                <div className="flex-1 space-y-2">
                  <div className={`h-4 w-3/4 ${skeletonClass}`} />
                  <div className={`h-3 w-1/3 ${skeletonClass}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className={`rounded-2xl border ${classNames.border} ${classNames.surface} p-6`}
          >
            <div className={`mb-6 h-6 w-40 ${skeletonClass}`} />

            <div className="flex h-[280px] items-center justify-center">
              <div className={`size-48 rounded-full ${skeletonClass}`} />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
