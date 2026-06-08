import { X } from "lucide-react";
import { FilterChip } from "../page";

export default function FilterChipButton({ chip }: { chip: FilterChip }) {
  return (
    <button
      type="button"
      onClick={chip.onRemove}
      className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-medium text-[var(--text-secondary)] shadow-xs transition hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]"
      title={`Remove ${chip.label}`}
    >
      <span className="truncate">{chip.label}</span>
      <X size={13} className="shrink-0" />
    </button>
  );
}
