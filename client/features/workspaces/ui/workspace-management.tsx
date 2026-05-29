"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell, Badge, Button, Card, CardBody, EmptyState, ErrorState, Field, Input } from "@/shared/ui/components";
import { useAllProjects } from "@/features/projects/hooks/use-projects";
import { useCreateWorkspace, useDeleteWorkspace, useUpdateWorkspace, useWorkspaces } from "../hooks/use-workspaces";
import type { Workspace } from "../types";
import { WorkspacesSkeleton } from "./workspaces-skeleton";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function WorkspaceRow({
  workspace,
  projectCount,
}: {
  workspace: Workspace;
  projectCount: number;
}) {
  const updateWorkspace = useUpdateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(workspace.name);
  const [slug, setSlug] = useState(workspace.slug);

  function save() {
    const cleanSlug = slugify(slug);
    if (!name.trim() || !cleanSlug) return;
    updateWorkspace.mutate(
      { id: workspace.id, input: { name: name.trim(), slug: cleanSlug } },
      { onSuccess: () => setEditing(false) },
    );
  }

  function remove() {
    if (!window.confirm(`Delete workspace "${workspace.name}"?`)) return;
    deleteWorkspace.mutate(workspace.id);
  }

  return (
    <Card>
      <CardBody>
        {editing ? (
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <Field label="Name">
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <Field label="Slug">
              <Input value={slug} onChange={(event) => setSlug(event.target.value)} />
            </Field>
            <div className="flex items-end gap-2">
              <Button onClick={save} disabled={updateWorkspace.isPending}>Save</Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-[#111827]">{workspace.name}</h2>
              <p className="mt-1 text-sm text-[#6B7280]">{workspace.slug}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="cyan">{projectCount} projects</Badge>
              <Link href={`/workspaces/${workspace.id}`}>
                <Button variant="ghost">Open workspace</Button>
              </Link>
              <Button variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
              <Button variant="danger" onClick={remove} disabled={deleteWorkspace.isPending}>Delete</Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export function WorkspaceManagement() {
  const workspaces = useWorkspaces();
  const projects = useAllProjects();
  const createWorkspace = useCreateWorkspace();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanSlug = slugify(slug || name);
    if (!name.trim() || !cleanSlug) return;
    createWorkspace.mutate(
      { name: name.trim(), slug: cleanSlug },
      {
        onSuccess: () => {
          setName("");
          setSlug("");
          setShowCreate(false);
        },
      },
    );
  }

  return (
    <AppShell
      title="Workspaces"
      eyebrow="Management"
      action={<Button onClick={() => setShowCreate((value) => !value)}>{showCreate ? "Close" : "Create workspace"}</Button>}
    >
      <div className="grid gap-4">
        {showCreate ? (
          <Card>
            <CardBody>
              <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={submit}>
                <Field label="Workspace name">
                  <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Solo Studio" />
                </Field>
                <Field label="Slug">
                  <Input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="solo-studio" />
                </Field>
                <div className="flex items-end">
                  <Button type="submit" disabled={createWorkspace.isPending}>Create</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        ) : null}

        <section className="grid gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">Workspace list</h2>
            <p className="mt-1 text-sm text-[#6B7280]">Create, edit, delete, and open workspaces.</p>
          </div>
          {workspaces.isLoading || projects.isLoading ? <WorkspacesSkeleton /> : null}
          {workspaces.isError || projects.isError ? <ErrorState message="Could not load workspace management data." /> : null}
          {workspaces.data?.length === 0 ? <EmptyState title="No workspaces yet" description="Create your first workspace to start organizing projects." /> : null}
          {workspaces.data?.map((workspace) => (
            <WorkspaceRow
              key={workspace.id}
              workspace={workspace}
              projectCount={projects.data?.filter((project) => project.workspace_id === workspace.id).length ?? 0}
            />
          ))}
        </section>
      </div>
    </AppShell>
  );
}
