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
    <div className="grid grid-cols-[1fr_256px] items-center gap-5 border-b border-[var(--border)] px-4 py-4 last:border-b-0">
      <div className="min-w-0">
        <div className="text-sm font-semibold">{label}</div>
        {description && (
          <div className={`mt-1 text-sm ${classNames.text.secondary}`}>
            {description}
          </div>
        )}
      </div>

      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Input({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="
        w-full rounded-lg border border-[var(--border)] bg-transparent
        px-3 py-2 text-sm font-semibold outline-none
        focus:border-[var(--primary)]
      "
    />
  );
}
