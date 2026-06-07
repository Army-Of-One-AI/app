import { LucideProps } from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

export default function SummaryMetricCard({
  icon: Icon,
  value,
  label,
  subLabel,
  loading,
}: {
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  value: number;
  label: string;
  subLabel: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
            {loading ? "—" : value}
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
            {label}
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            {subLabel}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--text-secondary)]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
