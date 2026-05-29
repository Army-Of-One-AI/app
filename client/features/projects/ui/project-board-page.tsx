"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AgentPipelineInspector } from "@/features/agent-roles/ui/agent-pipeline-inspector";
import { AgentPipelineView } from "@/features/agent-roles/ui/agent-pipeline-view";
import { AgentRoleManager } from "@/features/agent-roles/ui/agent-role-manager";
import { BoardSkeleton } from "@/features/boards/ui/board-skeleton";
import { ProjectKanban } from "@/features/boards/ui/project-kanban";
import { useDocuments } from "@/features/documents/hooks/use-documents";
import type { Document as ProjectDocument } from "@/features/documents/types";
import { DocumentReader, formatDocumentDate, getDocumentOutline } from "@/features/documents/ui/document-reader";
import { DocumentsSkeleton } from "@/features/documents/ui/documents-skeleton";
import { TaskInspectorPanel } from "@/features/tasks/ui/task-inspector-panel";
import { AppShell, Badge, Button, EmptyState, ErrorState, WorkspaceCanvas } from "@/shared/ui/components";
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
        <ProjectDocumentsView projectId={project.data.id} />
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

function ProjectDocumentsView({ projectId }: { projectId: string }) {
  const documents = useDocuments(projectId);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>();
  const documentGroups = useMemo(
    () => groupDocumentsByCategory(documents.data ?? []),
    [documents.data],
  );
  const selectedDocument = useMemo(() => {
    return (
      documents.data?.find((document) => document.id === selectedDocumentId) ??
      documents.data?.[0]
    );
  }, [documents.data, selectedDocumentId]);

  useEffect(() => {
    if (!documents.data?.length) {
      setSelectedDocumentId(undefined);
      return;
    }
    if (selectedDocumentId && documents.data.some((document) => document.id === selectedDocumentId)) {
      return;
    }
    setSelectedDocumentId(documents.data[0].id);
  }, [documents.data, selectedDocumentId]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    console.debug("Project Documents view projectId", { projectId });
  }, [projectId]);

  return (
    <WorkspaceCanvas scrollable>
      <div className="p-6 pb-12">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[#111827]">Documents</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Planning and project documents connected to this project.
          </p>
        </div>

        {documents.isLoading ? <DocumentsSkeleton /> : null}
        {documents.isError ? <ErrorState message="Could not load project documents." /> : null}
        {documents.isSuccess && documents.data.length === 0 ? (
          <EmptyState title="No documents" description="Project documents will appear here after they are created." />
        ) : null}
        {documents.isSuccess && documents.data.length > 0 ? (
          <div className="grid min-h-[640px] gap-5 xl:grid-cols-[300px_minmax(0,1fr)_260px]">
            <aside className="h-fit rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between px-2 py-2">
                <p className="text-xs font-semibold uppercase tracking-normal text-[#6B7280]">
                  Documents
                </p>
                <Badge tone="cyan">{documents.data.length}</Badge>
              </div>
              <div className="mt-2 grid gap-4">
                {documentGroups.map((group) => (
                  <DocumentGroup
                    key={group.category}
                    group={group}
                    selectedDocumentId={selectedDocument?.id}
                    onSelectDocument={setSelectedDocumentId}
                  />
                ))}
              </div>
            </aside>

            <main className="min-w-0">
              {selectedDocument ? <DocumentReader document={selectedDocument} /> : null}
            </main>

            <DocumentMetadataPanel document={selectedDocument} />
          </div>
        ) : null}
      </div>
    </WorkspaceCanvas>
  );
}

type DocumentCategory =
  | "Product Documents"
  | "Technical Documents"
  | "Quality Documents"
  | "Other Documents";

type DocumentGroupModel = {
  category: DocumentCategory;
  documents: ProjectDocument[];
};

const categoryOrder: DocumentCategory[] = [
  "Product Documents",
  "Technical Documents",
  "Quality Documents",
  "Other Documents",
];

function DocumentGroup({
  group,
  selectedDocumentId,
  onSelectDocument,
}: {
  group: DocumentGroupModel;
  selectedDocumentId: string | undefined;
  onSelectDocument: (documentId: string) => void;
}) {
  return (
    <section>
      <h3 className="px-2 text-xs font-semibold uppercase tracking-normal text-[#6B7280]">
        {group.category}
      </h3>
      <div className="mt-2 grid gap-1">
        {group.documents.map((document) => {
          const selected = document.id === selectedDocumentId;
          return (
            <button
              key={document.id}
              type="button"
              onClick={() => onSelectDocument(document.id)}
              className={`rounded-xl border px-3 py-3 text-left transition ${
                selected
                  ? "border-[#C7D2FE] bg-[#EEF2FF]"
                  : "border-transparent hover:border-[#E5E7EB] hover:bg-[#F7F8FC]"
              }`}
            >
              <p className="line-clamp-2 text-sm font-semibold leading-5 text-[#111827]">
                {document.title}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge>{document.source_type}</Badge>
                <span className="text-xs text-[#6B7280]">
                  {formatDocumentDate(document.created_at)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function DocumentMetadataPanel({
  document,
}: {
  document: ProjectDocument | undefined;
}) {
  const outline = useMemo(
    () => getDocumentOutline(document?.content ?? ""),
    [document?.content],
  );

  if (!document) return null;

  return (
    <aside className="hidden h-fit rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm xl:block">
      <h3 className="text-sm font-semibold text-[#111827]">Details</h3>
      <dl className="mt-4 grid gap-3 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-normal text-[#6B7280]">
            Type
          </dt>
          <dd className="mt-1">
            <Badge>{document.source_type}</Badge>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-normal text-[#6B7280]">
            Created
          </dt>
          <dd className="mt-1 text-[#374151]">
            {formatDocumentDate(document.created_at)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-normal text-[#6B7280]">
            Category
          </dt>
          <dd className="mt-1 text-[#374151]">
            {documentCategory(document.title)}
          </dd>
        </div>
      </dl>
      <div className="mt-6 border-t border-[#E5E7EB] pt-4">
        <h3 className="text-sm font-semibold text-[#111827]">Outline</h3>
        {outline.length === 0 ? (
          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            No headings found.
          </p>
        ) : (
          <nav className="mt-3 grid gap-2">
            {outline.slice(0, 12).map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className={`truncate text-sm leading-6 text-[#6B7280] ${
                  item.level === 3 ? "pl-4" : item.level === 2 ? "pl-2" : ""
                }`}
                title={item.text}
              >
                {item.text}
              </div>
            ))}
          </nav>
        )}
      </div>
    </aside>
  );
}

function groupDocumentsByCategory(documents: ProjectDocument[]) {
  return categoryOrder
    .map((category) => ({
      category,
      documents: documents.filter(
        (document) => documentCategory(document.title) === category,
      ),
    }))
    .filter((group) => group.documents.length > 0);
}

function documentCategory(title: string): DocumentCategory {
  const normalized = title.toLowerCase();
  if (
    [
      "product requirements",
      "prd",
      "mvp scope",
      "user stories",
      "milestones",
      "acceptance rules",
    ].some((keyword) => normalized.includes(keyword))
  ) {
    return "Product Documents";
  }
  if (
    ["technical design", "api design", "database design", "architecture"].some(
      (keyword) => normalized.includes(keyword),
    )
  ) {
    return "Technical Documents";
  }
  if (
    ["test plan", "test cases", "quality", "qa"].some((keyword) =>
      normalized.includes(keyword),
    )
  ) {
    return "Quality Documents";
  }
  return "Other Documents";
}
