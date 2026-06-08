import { classNames } from "@/shared/styles/classNames";
import Sidebar from "./Sidebar";

type Props = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: Props) {
  return (
    <div
      className={`
        absolute inset-0 overflow-hidden
        ${classNames.background}
      `}
    >
      <Sidebar />

      <main
        className={`
          absolute
          top-3
          right-3
          left-64
          bottom-3
          h-[calc(100vh-24px)]
          overflow-hidden
          rounded-2xl
          border
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
