import { Project } from "@/features/projects/types";
import { classNames, projectStatusColors } from "@/shared/styles/classNames";
import Button from "@/shared/ui/Button";
import { parseRichText } from "@/shared/utils/helpers";
import { useParams, useRouter } from "next/navigation";

const sectionClassName = `border-b ${classNames.border} p-6`;
const sectionTitleClassName = `mb-4 text-sm font-semibold uppercase tracking-wide ${classNames.text.secondary}`;

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
    <div className={`flex h-full min-w-lg flex-col ${classNames.text.primary}`}>
      <div className={sectionClassName}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className={`text-xl font-semibold ${classNames.text.primary}`}>
              {project.name}
            </h2>

            <p className={`mt-1 text-sm ${classNames.text.secondary}`}>
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
        <section className={sectionClassName}>
          <h3 className={sectionTitleClassName}>
            Description
          </h3>

          <div
            className="rich-text max-h-[200px] overflow-y-auto"
            dangerouslySetInnerHTML={{
              __html: parseRichText(project.description).html,
            }}
          />
        </section>

        <section className={sectionClassName}>
          <h3 className={sectionTitleClassName}>
            Details
          </h3>

          <div className="space-y-4">
            <DetailRow label="Start Date" value="01 Jun 2026" />

            <DetailRow label="Target Date" value="30 Sep 2026" />

            <DetailRow label="Owner" value="Hoang Vu Le" />

            <DetailRow label="Created" value="2 months ago" />
          </div>
        </section>

        <section className={sectionClassName}>
          <h3 className={sectionTitleClassName}>
            Progress
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Tasks completed</span>
              <span>18 / 42</span>
            </div>

            <div className={`h-2 overflow-hidden rounded-full ${classNames.secondary.bg}`}>
              <div
                className={`h-full rounded-full ${classNames.primary.bg}`}
                style={{ width: "43%" }}
              />
            </div>
          </div>
        </section>

        <section className={sectionClassName}>
          <h3 className={sectionTitleClassName}>
            Members
          </h3>

          <div className="flex -space-x-2">
            {project.members.map((m) => (
	              <div
	                key={m.id}
	                className={`
	                flex
	                h-9
	                w-9
                items-center
	                justify-center
	                rounded-full
	                border-2
	                border-[var(--surface)]
	                ${classNames.primary.bg}
	                ${classNames.primary.text}
	                text-xs
	                font-semibold
	                tracking-widest
	              `}
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

        <section className={sectionClassName}>
          <h3 className={sectionTitleClassName}>
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
          <h3 className={sectionTitleClassName}>
            Recent Activity
          </h3>

          <div className="space-y-4">
            <ActivityItem text="John completed Design System" time="2h ago" />

            <ActivityItem text="Task #123 moved to Done" time="5h ago" />

            <ActivityItem text="Sprint planning completed" time="Yesterday" />
          </div>
        </section>
      </div>

      <div className={`sticky bottom-0 w-full border-t px-4 py-6 ${classNames.border} ${classNames.surface}`}>
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
      <span className={classNames.text.secondary}>{label}</span>

      <span className={classNames.text.primary}>{value}</span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className={`rounded-lg border p-3 ${classNames.card.border}`}>
      <div className={`text-xl font-semibold ${classNames.text.primary}`}>
        {value}
      </div>

      <div className={`text-xs ${classNames.text.secondary}`}>{label}</div>
    </div>
  );
}

function ActivityItem({ text, time }: { text: string; time: string }) {
  return (
    <div>
      <div className={`text-sm ${classNames.text.primary}`}>{text}</div>
      <div className={`text-xs ${classNames.text.secondary}`}>{time}</div>
    </div>
  );
}
