"use client";

import ModalProvider from "@/shared/providers/ModalProvider";
import QueryProvider from "@/shared/providers/QueryProvider";
// import ReduxProvider from "@/shared/providers/ReduxProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ModalProvider>{children}</ModalProvider>
    </QueryProvider>
  );
}
