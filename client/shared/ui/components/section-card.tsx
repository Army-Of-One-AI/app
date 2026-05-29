import type { ReactNode } from "react";

export function SectionCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-[#111827]">{title}</h2>
          {description ? <p className="mt-1 text-xs text-[#6B7280]">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
