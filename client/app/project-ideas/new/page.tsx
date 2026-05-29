import { Suspense } from "react";
import { CreateProjectWizard } from "@/features/project-ideas/ui/create-project-wizard";
import { AppShell, Card, CardBody, Skeleton } from "@/shared/ui/components";

function ProjectIdeaLoading() {
  return (
    <AppShell title="Create Project From Idea" eyebrow="Product Discovery">
      <Card>
        <CardBody>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-4 h-10 w-full" />
          <Skeleton className="mt-3 h-28 w-full" />
        </CardBody>
      </Card>
    </AppShell>
  );
}

export default function NewProjectIdeaPage() {
  return (
    <Suspense fallback={<ProjectIdeaLoading />}>
      <CreateProjectWizard />
    </Suspense>
  );
}
