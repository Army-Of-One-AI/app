"use client";

import PageContent from "@/shared/ui/DashboardLayout/PageContent";

export default function WorkspacePage() {
  return (
    <PageContent title="123">
      {Array(100)
        .fill("")
        .map((_, i) => (
          <h1 key={`text-${i + 1}`}>{i + 1}</h1>
        ))}
    </PageContent>
  );
}
