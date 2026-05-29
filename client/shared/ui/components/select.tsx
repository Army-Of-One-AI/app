import type { SelectHTMLAttributes } from "react";

export function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`min-h-10 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] outline-none transition focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15 ${className}`}
      {...props}
    />
  );
}
