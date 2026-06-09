import { classNames } from "@/shared/styles/classNames";
import Sidebar from "./Sidebar";

type Props = {
  children: React.ReactNode;
};

export default function SettingsLayout({ children }: Props) {
  return (
    <div
      className={`
        flex min-h-screen gap-3 overflow-hidden p-3
        ${classNames.background}
      `}
    >
      <Sidebar />

      <main
        className={`
          min-w-0 flex-1 overflow-y-auto rounded-2xl border
          ${classNames.background}
          ${classNames.border}
          shadow-[var(--shadow-soft)]
        `}
      >
        {children}
      </main>
    </div>
  );
}
