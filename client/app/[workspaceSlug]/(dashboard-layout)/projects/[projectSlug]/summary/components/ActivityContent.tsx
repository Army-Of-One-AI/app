import { RecentTaskActivity } from "@/features/projects/types";
import TaskBadge from "./TaskBadge";
import { ChevronRight } from "lucide-react";
import ActivityBadge from "./ActivityBadge";
import StatusPill from "./StatusPill";
import { formatDate } from "@/shared/utils/helpers";
import { TaskStatus } from "@/shared/types/enums";

export default function ActivityContent({
  activity,
  onTaskClick,
}: {
  activity: RecentTaskActivity;
  onTaskClick: (taskId?: string) => void;
}) {
  const actorName = activity.actor?.fullName || "Someone";
  const before = activity.metadata?.before;
  const after = activity.metadata?.after;
  const task = activity.task;
  const taskTitle = task?.title ?? "Unknown task";

  if (activity.activity === "STATUS_CHANGED") {
    return (
      <>
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="font-semibold text-[var(--text-primary)]">
            {actorName}
          </span>
          <span className="text-[var(--text-secondary)]">
            changed status on
          </span>
          <TaskBadge taskId={task?.id} onClick={onTaskClick}>
            {taskTitle}
          </TaskBadge>
          <StatusPill status={task?.status} />
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <StatusPill status={before as TaskStatus} />
          <ChevronRight className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
          <StatusPill status={after as TaskStatus} />
        </div>
      </>
    );
  }

  if (activity.activity === "DUE_DATE_CHANGED") {
    return (
      <>
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="font-semibold text-[var(--text-primary)]">
            {actorName}
          </span>
          <span className="text-[var(--text-secondary)]">
            changed due date on
          </span>
          <TaskBadge taskId={task?.id} onClick={onTaskClick}>
            {taskTitle}
          </TaskBadge>
          <StatusPill status={task?.status} />
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <ActivityBadge>{before ? formatDate(before) : "None"}</ActivityBadge>
          <ChevronRight className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
          <ActivityBadge>{after ? formatDate(after) : "None"}</ActivityBadge>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-sm">
      <span className="font-semibold text-[var(--text-primary)]">
        {actorName}
      </span>
      <span className="text-[var(--text-secondary)]">
        updated {activity.activity?.replaceAll("_", " ").toLowerCase()}
      </span>
      <TaskBadge taskId={task?.id} onClick={onTaskClick}>
        {taskTitle}
      </TaskBadge>
      <StatusPill status={task?.status} />
    </div>
  );
}
