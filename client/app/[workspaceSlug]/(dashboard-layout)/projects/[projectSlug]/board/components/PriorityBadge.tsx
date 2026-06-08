import { Task } from "@/features/tasks/types";
import { taskPriorityColors } from "@/shared/styles/classNames";

export default function PriorityBadge({
  priority,
}: {
  priority: Task["priority"];
}) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-[11px] font-semibold ${taskPriorityColors[priority]}`}
    >
      {priority}
    </span>
  );
}
