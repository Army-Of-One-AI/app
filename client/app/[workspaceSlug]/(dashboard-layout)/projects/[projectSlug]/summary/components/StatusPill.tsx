import { taskStatusConfig } from "@/shared/styles/classNames";
import { TaskStatus } from "@/shared/types/enums";

export default function StatusPill({ status }: { status?: TaskStatus | null }) {
  if (!status || !taskStatusConfig[status]) return null;

  const config = taskStatusConfig[status];

  return (
    <span
      className="inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
      style={{
        backgroundColor: config.bg,
        color: config.text,
      }}
    >
      {config.label}
    </span>
  );
}
