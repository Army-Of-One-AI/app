import { classNames } from "@/shared/styles/classNames";

export default function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 border-b border-[var(--border)] px-4 py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_minmax(220px,320px)] md:items-center md:gap-5">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-[var(--text-primary)]">
          {label}
        </div>
        {description && (
          <div className={`mt-1 text-sm ${classNames.text.secondary}`}>
            {description}
          </div>
        )}
      </div>
      <div className="min-w-0 md:justify-self-end md:[&>*]:max-w-full">
        {children}
      </div>
    </div>
  );
}
