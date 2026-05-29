import type { AgentRoleType } from "@/features/agent-roles/types";
import { getRoleDisplayName } from "@/features/agent-roles/core-team";
import type { TaskPriority, TaskStatus } from "@/features/tasks/types";

export function StatusBadge({ status }: { status: TaskStatus | string }) {
  return <span className="rounded-full bg-[#EEF2FF] px-2 py-1 text-[11px] font-medium text-[#4F46E5]">{status}</span>;
}

export function RoleBadge({ role }: { role?: AgentRoleType | string | null }) {
  return <span className="rounded-full bg-[#ECFEFF] px-2 py-1 text-[11px] font-medium text-[#0891B2]">{getRoleDisplayName(role)}</span>;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const className =
    priority === "URGENT" || priority === "HIGH"
      ? "bg-red-50 text-[#EF4444]"
      : priority === "MEDIUM"
        ? "bg-amber-50 text-[#F59E0B]"
        : "bg-emerald-50 text-[#22C55E]";

  return <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${className}`}>{priority}</span>;
}
