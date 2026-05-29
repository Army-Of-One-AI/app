"use client";

import { useState } from "react";
import Link from "next/link";
import { AgentRoleManager } from "@/features/agent-roles/ui/agent-role-manager";
import { ProjectList } from "@/features/projects/ui/project-list";
import { AppShell, Button, ErrorState } from "@/shared/ui/components";
import { useWorkspace } from "../hooks/use-workspaces";
import { WorkspacesSkeleton } from "./workspaces-skeleton";

export function WorkspaceDetail({ workspaceId }: { workspaceId: string }) {
  const workspace = useWorkspace(workspaceId);
  const [showCreateProject, setShowCreateProject] = useState(false);

  if (workspace.isLoading) {
    return (
      <AppShell title="Workspace" eyebrow="Loading">
        <WorkspacesSkeleton />
      </AppShell>
    );
  }
  if (workspace.isError || !workspace.data) return <ErrorState message="Could not load workspace." />;

  return (
    <AppShell
      title={workspace.data.name}
      eyebrow="Workspace"
      workspaceId={workspaceId}
      action={<Button onClick={() => setShowCreateProject((value) => !value)}>{showCreateProject ? "Close" : "Create project"}</Button>}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="grid content-start gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">Projects</h2>
            <p className="mt-1 text-sm text-[#6B7280]">Create projects here, then open a project to work from its Kanban board.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/project-ideas/new?workspaceId=${workspaceId}`}>
              <Button variant="secondary">Start from an Idea</Button>
            </Link>
          </div>
          <ProjectList workspaceId={workspaceId} showCreateForm={showCreateProject} />
        </section>
        <section className="grid content-start gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">Core Team</h2>
            <p className="mt-1 text-sm text-[#6B7280]">Fixed software team roles with customizable skills and preferences.</p>
          </div>
          <AgentRoleManager workspaceId={workspaceId} />
        </section>
      </div>
    </AppShell>
  );
}
