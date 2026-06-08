import { LucideIcon } from "lucide-react";

export default function BoardMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="flex min-w-[118px] items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-xs">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--secondary)] text-[var(--text-primary)]">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[var(--text-secondary)]">{label}</p>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {value}
        </p>
      </div>
    </div>
  );
}
