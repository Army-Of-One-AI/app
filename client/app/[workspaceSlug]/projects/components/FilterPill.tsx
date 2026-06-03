import { classNames } from "@/shared/styles/classNames";

export default function FilterPill({
  children,
  active = false,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        rounded-full border px-4 py-1 text-sm transition-all
        ${classNames.border}
        ${active ? "text-[var(--on-primary)]" : classNames.text.secondary}
        ${
          active
            ? "border-[var(--primary)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-bg-hover)]"
            : "hover:bg-[var(--surface)]"
        }
      `}
    >
      {children}
    </button>
  );
}
