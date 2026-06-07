import { ReactNode } from "react";

export default function TaskBadge({
  children,
  taskId,
  onClick,
}: {
  children: ReactNode;
  taskId?: string;
  onClick: (taskId?: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(taskId)}
      disabled={!taskId}
      className="inline-flex max-w-[180px] items-center truncate rounded-md border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-1.5 py-0.5 text-xs font-semibold text-[var(--primary)] transition hover:bg-[var(--primary)]/15 disabled:cursor-default disabled:opacity-70"
    >
      {children}
    </button>
  );
}
