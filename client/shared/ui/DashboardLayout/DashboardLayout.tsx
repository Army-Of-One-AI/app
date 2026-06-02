import { classNames } from "@/shared/styles/classNames";
import Sidebar from "./Sidebar";

type Props = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: Props) {
  return (
    <div
      className={`
        absolute inset-0
        ${classNames.background}
      `}
    >
      <Sidebar />

      <main
        className={`
          absolute
          top-3
          left-60
          h-[calc(100vh-24px)]
          w-[calc(100vw-252px)]
          overflow-y-auto
          rounded-xl
          border
          ${classNames.background}
          ${classNames.border}
          shadow-lg
        `}
      >
        {children}
      </main>
    </div>
  );
}