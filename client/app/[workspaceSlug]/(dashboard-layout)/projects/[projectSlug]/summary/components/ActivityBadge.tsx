import { ReactNode } from "react";

export default function ActivityBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-md border border-[var(--border)] bg-[var(--secondary)] px-1.5 py-0.5 text-xs font-medium text-[var(--text-primary)]">
      {children}
    </span>
  );
}
