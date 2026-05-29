"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AgentPipelineInspector } from "@/features/agent-roles/ui/agent-pipeline-inspector";
import { AgentPipelineView } from "@/features/agent-roles/ui/agent-pipeline-view";
import { AgentRoleManager } from "@/features/agent-roles/ui/agent-role-manager";
import { BoardSkeleton } from "@/features/boards/ui/board-skeleton";
import { ProjectKanban } from "@/features/boards/ui/project-kanban";
import { TaskInspectorPanel } from "@/features/tasks/ui/task-inspector-panel";
import { AppShell, Button, EmptyState, ErrorState, SectionCard, WorkspaceCanvas } from "@/shared/ui/components";
import { useProject } from "../hooks/use-projects";

type ProjectViewMode = "Board" | "Pipeline" | "Core Team" | "Documents";

const viewFromParam: Record<string, ProjectViewMode> = {
  board: "Board",
  "agent-pipeline": "Pipeline",
  pipeline: "Pipeline",
  agents: "Core Team",
  "core-team": "Core Team",
  documents: "Documents",
} satisfies Record<string, ProjectViewMode>;

const paramFromView: Record<ProjectViewMode, string> = {
  Board: "board",
  Pipeline: "pipeline",
  "Core Team": "core-team",
  Documents: "documents",
};

export function ProjectBoardPage({ projectId }: { projectId: string }) {
  const project = useProject(projectId);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>();
  const [selectedPipelineStepId, setSelectedPipelineStepId] = useState<string>();
  const viewParam = searchParams.get("view") ?? "board";
  const viewMode = viewFromParam[viewParam] ?? "Board";

  function changeView(mode: ProjectViewMode) {
    router.push(`/projects/${projectId}?view=${paramFromView[mode]}`);
  }

  if (project.isLoading) {
    return (
      <AppShell title="Project" eyebrow="Loading">
        <BoardSkeleton />
      </AppShell>
    );
  }
  if (project.isError || !project.data) return <ErrorState message="Could not load project." />;

  const inspector =
    viewMode === "Pipeline" ? (
      <AgentPipelineInspector workspaceId={project.data.workspace_id} selectedStepId={selectedPipelineStepId} />
    ) : viewMode === "Board" && selectedTaskId ? (
      <TaskInspectorPanel
        taskId={selectedTaskId}
        projectId={project.data.id}
        boardId={project.data.boards?.[0]?.id}
        workspaceId={project.data.workspace_id}
        onClose={() => setSelectedTaskId(undefined)}
      />
    ) : undefined;

  return (
    <AppShell
      title={project.data.name}
      eyebrow={viewMode}
      workspaceId={project.data.workspace_id}
      currentProjectId={project.data.id}
      viewMode={viewMode}
      onViewModeChange={changeView}
      inspector={inspector}
      action={viewMode === "Board" ? <Button onClick={() => setShowCreateTask((value) => !value)}>{showCreateTask ? "Close" : "Create task"}</Button> : null}
      bottomBar={
        <div className="flex items-center justify-between text-xs text-[#6B7280]">
          <span>{viewMode} view</span>
          <span>Selected: {selectedTaskId ?? selectedPipelineStepId ?? "none"}</span>
        </div>
      }
    >
      {viewMode === "Board" ? (
        <ProjectKanban
          projectId={project.data.id}
          workspaceId={project.data.workspace_id}
          showCreateForm={showCreateTask}
          selectedTaskId={selectedTaskId}
          onSelectTask={setSelectedTaskId}
        />
      ) : null}
      {viewMode === "Pipeline" ? (
        <AgentPipelineView workspaceId={project.data.workspace_id} selectedStepId={selectedPipelineStepId} onSelectStep={setSelectedPipelineStepId} />
      ) : null}
      {viewMode === "Documents" ? (
        <WorkspaceCanvas>
          <div className="p-6">
            <SectionCard title="Documents" description="Project documents will appear here when connected through the existing documents API.">
              <EmptyState title="No document workspace yet" description="This refactor only changes the UI shell and does not add backend behavior." />
            </SectionCard>
          </div>
        </WorkspaceCanvas>
      ) : null}
      {viewMode === "Core Team" ? (
        <WorkspaceCanvas scrollable>
          <div className="p-6 pb-12">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[#111827]">Core Team</h2>
              <p className="mt-1 text-sm text-[#6B7280]">Fixed software team roles with customizable skills, preferences, and model assignments.</p>
            </div>
            <AgentRoleManager workspaceId={project.data.workspace_id} />
          </div>
        </WorkspaceCanvas>
      ) : null}
    </AppShell>
  );
}
