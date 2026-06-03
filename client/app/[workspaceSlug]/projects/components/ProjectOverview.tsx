import { Project } from "@/features/projects/types";
import { projectStatusColors } from "@/shared/styles/classNames";
import Button from "@/shared/ui/Button";
import { useParams, useRouter } from "next/navigation";

export default function ProjectOverview({
  project,
}: {
  project: Project | null | undefined;
}) {
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;

  if (!project) return null;

  return (
    <div className="flex h-full flex-col min-w-lg">
      <div className="border-b border-(--border) p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">{project.name}</h2>

            <p className="mt-1 text-sm text-(--text-secondary)">
              {project.slug}
            </p>
          </div>

          <span
            className={`
                rounded-full
                px-3
                py-1
                text-xs
                font-medium        
                ${projectStatusColors[project.status]}
              `}
          >
            {project.status.split("_").join(" ")}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <section className="border-b border-[var(--border)] p-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            Description
          </h3>

          <div
            className="rich-text max-h-[200px] overflow-y-auto"
            dangerouslySetInnerHTML={{
              __html: project.description?.html ?? "",
            }}
          />
        </section>

        <section className="border-b border-[var(--border)] p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            Details
          </h3>

          <div className="space-y-4">
            <DetailRow label="Start Date" value="01 Jun 2026" />

            <DetailRow label="Target Date" value="30 Sep 2026" />

            <DetailRow label="Owner" value="Hoang Vu Le" />

            <DetailRow label="Created" value="2 months ago" />
          </div>
        </section>

        <section className="border-b border-[var(--border)] p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            Progress
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Tasks completed</span>
              <span>18 / 42</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-[var(--secondary)]">
              <div
                className="h-full rounded-full bg-[var(--primary)]"
                style={{ width: "43%" }}
              />
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--border)] p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            Members
          </h3>

          <div className="flex -space-x-2">
            {project.members.map((m) => (
              <div
                key={m.id}
                className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                border-2
                border-white
                bg-[var(--primary)]
                text-xs
                font-semibold
                tracking-widest
              "
              >
                {m.fullName
                  ?.split(" ")
                  .map((str) => str.charAt(0))
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-[var(--border)] p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            Statistics
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Tasks" value={project.taskCount.toString()} />

            <StatCard
              label="Members"
              value={project.members.length.toString()}
            />
            <StatCard
              label="Members"
              value={project.members.length.toString()}
            />
            <StatCard
              label="Members"
              value={project.members.length.toString()}
            />
          </div>
        </section>

        <section className="px-6 max-h-[200px] pt-6 pb-10 overflow-y-auto">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            Recent Activity
          </h3>

          <div className="space-y-4">
            <ActivityItem text="John completed Design System" time="2h ago" />

            <ActivityItem text="Task #123 moved to Done" time="5h ago" />

            <ActivityItem text="Sprint planning completed" time="Yesterday" />
          </div>
        </section>
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--surface)] py-6 px-4 sticky bottom-0 w-full">
        <div className="flex gap-2">
          <Button
            onClick={() =>
              router.push(`/${workspaceSlug}/projects/${project.slug}`)
            }
            className="flex-1"
          >
            Overview
          </Button>

          <Button
            onClick={() =>
              router.push(`/${workspaceSlug}/projects/${project.slug}/board`)
            }
            variant="secondary"
            className="flex-1"
          >
            View Board
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--text-secondary)]">{label}</span>

      <span>{value}</span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-3">
      <div className="text-xl font-semibold">{value}</div>

      <div className="text-xs text-[var(--text-secondary)]">{label}</div>
    </div>
  );
}

function ActivityItem({ text, time }: { text: string; time: string }) {
  return (
    <div>
      <div className="text-sm">{text}</div>
      <div className="text-xs text-[var(--text-secondary)]">{time}</div>
    </div>
  );
}
