import type { ReactNode } from "react";

export function InspectorPanel({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid h-full max-h-screen grid-rows-[auto_1fr_auto]">
      <div className="border-b border-[#E5E7EB] px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-normal text-[#6B7280]">Inspector</p>
        <h2 className="mt-1 text-base font-semibold text-[#111827]">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p> : null}
      </div>
      <div className="min-h-0 overflow-y-auto p-5">{children}</div>
      {footer ? <div className="border-t border-[#E5E7EB] bg-white p-4">{footer}</div> : null}
    </div>
  );
}

export function InspectorSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="group border-b border-[#E5E7EB] py-4" open={defaultOpen}>
      <summary className="cursor-pointer list-none text-sm font-semibold text-[#111827]">
        <span className="inline-flex w-full items-center justify-between">
          {title}
          <span className="text-[#6B7280] group-open:rotate-180">⌄</span>
        </span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
