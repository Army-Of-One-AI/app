/* eslint-disable @next/next/no-img-element */
import { RecentTaskActivity } from "@/features/projects/types";
import ActivityContent from "./ActivityContent";
import { formatRelativeTime } from "@/shared/utils/helpers";

export default function ActivityRow({
  activity,
  onTaskClick,
}: {
  activity: RecentTaskActivity;
  onTaskClick: (taskId?: string) => void;
}) {
  const actorName = activity.actor?.fullName || "Someone";
  const avatar = activity.actor?.avatarURL;
  const initial = actorName.slice(0, 2).toUpperCase();

  return (
    <div className="group flex gap-3 rounded-xl p-2 transition hover:bg-[var(--secondary)]">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--primary)]/15 text-xs font-bold text-[var(--primary)]">
        {avatar ? (
          <img
            src={avatar}
            alt={actorName}
            className="h-full w-full object-cover"
          />
        ) : (
          initial
        )}
      </div>

      <div className="min-w-0 flex-1">
        <ActivityContent activity={activity} onTaskClick={onTaskClick} />

        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          {formatRelativeTime(activity.createdAt)}
        </p>
      </div>
    </div>
  );
}
