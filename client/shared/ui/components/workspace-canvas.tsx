import type { ReactNode } from "react";

export function WorkspaceCanvas({
  children,
  dotted = false,
  scrollable = false,
}: {
  children: ReactNode;
  dotted?: boolean;
  scrollable?: boolean;
}) {
  return (
    <div
      className={`${scrollable ? "h-full min-h-0 overflow-auto" : "h-full min-h-[calc(100vh-112px)] overflow-hidden"} bg-[#F7F8FC] ${
        dotted ? "bg-[radial-gradient(#D1D5DB_1px,transparent_1px)] [background-size:18px_18px]" : ""
      }`}
    >
      {children}
    </div>
  );
}
