"use client";

import QueryProvider from "@/shared/providers/queryProvider";
import ReduxProvider from "@/shared/providers/reduxProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
