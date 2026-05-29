import { ProjectBoardPage } from "@/features/projects/ui/project-board-page";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <ProjectBoardPage projectId={projectId} />;
}
