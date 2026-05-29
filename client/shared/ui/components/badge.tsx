import type { ReactNode } from "react";

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "cyan" | "pink" | "green" | "amber" }) {
  const tones = {
    slate: "bg-[#F7F8FC] text-[#6B7280]",
    cyan: "bg-cyan-50 text-[#06B6D4]",
    pink: "bg-red-50 text-[#EF4444]",
    green: "bg-emerald-50 text-[#22C55E]",
    amber: "bg-amber-50 text-[#F59E0B]",
  };

  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}
