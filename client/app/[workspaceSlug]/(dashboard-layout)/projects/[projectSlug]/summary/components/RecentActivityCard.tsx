import { Maximize2, Minimize2, X } from "lucide-react";
import ActivityRow from "./ActivityRow";
import { RecentTaskActivity } from "@/features/projects/types";
import useModal from "@/shared/hooks/useModal";

export default function RecentActivityCard({
  activities,
  loading,
  onTaskClick,
}: {
  activities: RecentTaskActivity[];
  loading?: boolean;
  onTaskClick: (taskId?: string) => void;
}) {
  const { openModal, closeModal } = useModal();

  const maximize = () => {
    openModal({
      title: "",
      customHeader: (
        <div className="flex items-center justify-between gap-4 w-full">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Recent activity
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Latest task changes in this project.
            </p>
          </div>

          <button
            onClick={closeModal}
            className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ),
      modalContent: (
        <div className="w-5xl max-w-screen h-5xl">
          <div className="mt-5 h-[60vh] w-full space-y-4 overflow-y-auto pr-2 activity-scroll">
            {loading ? (
              <p className="text-sm text-[var(--text-secondary)]">
                Loading activities...
              </p>
            ) : activities.length > 0 ? (
              activities.map((activity) => (
                <ActivityRow
                  key={activity.id}
                  activity={activity}
                  onTaskClick={onTaskClick}
                />
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--border)] py-8 text-center">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  No recent activity
                </p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Task updates will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      ),
    });
  };

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Recent activity
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Latest task changes in this project.
          </p>
        </div>

        <button
          onClick={maximize}
          className="rounded-lg border border-[var(--border)] p-2 text-[var(--text-secondary)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 max-h-[330px] space-y-4 overflow-y-auto pr-2 activity-scroll">
        {loading ? (
          <p className="text-sm text-[var(--text-secondary)]">
            Loading activities...
          </p>
        ) : activities.length > 0 ? (
          activities.map((activity) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              onTaskClick={onTaskClick}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--border)] py-8 text-center">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              No recent activity
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Task updates will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
