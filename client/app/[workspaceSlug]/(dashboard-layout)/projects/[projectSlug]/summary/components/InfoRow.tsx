export default function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[90px_1fr] gap-4 py-3 text-sm">
      <p className="text-[var(--text-secondary)]">{label}</p>
      <p className="break-all text-right font-semibold text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}
