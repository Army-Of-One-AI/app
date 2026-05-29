"use client";

import type { ReactNode } from "react";
import { Button } from "./button";

export function Sheet({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#111827]/35">
      <aside className="flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#111827]">{title}</h2>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </aside>
    </div>
  );
}
