'use client'

import useWorkspaceDetailsBySlug from "@/features/workspaces/hooks/useWorkspaceDetailsBySlug";
import PageContent from "@/shared/ui/DashboardLayout/PageContent";
import { useParams } from "next/navigation";

export default function WorkspacePage() {
  const params = useParams();
  const slug = params.workspaceSlug as string;
  const {} = useWorkspaceDetailsBySlug(slug);

  return (
    <PageContent title="123">
      {Array(100).fill("").map((_, i) =>
        <h1 key={`text-${i + 1}`}>{i + 1}</h1>
      )}
    </PageContent>
  )
}
