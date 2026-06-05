'use client'

import useWorkspaceDetailsBySlug from "@/features/workspaces/hooks/useWorkspaceDetailsBySlug";
import useSlugs from "@/shared/hooks/useSlugs";
import PageContent from "@/shared/ui/DashboardLayout/PageContent";

export default function WorkspacePage() {
  const { workspace } = useSlugs();
  const slug = workspace.slug;
  const {} = useWorkspaceDetailsBySlug(slug);

  return (
    <PageContent title="123">
      {Array(100).fill("").map((_, i) =>
        <h1 key={`text-${i + 1}`}>{i + 1}</h1>
      )}
    </PageContent>
  )
}
