"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, CardBody, EmptyState, ErrorState, Field, Input, Textarea } from "@/shared/ui/components";
import { useCreateProject, useProjects } from "../hooks/use-projects";
import { ProjectsSkeleton } from "./projects-skeleton";

export function ProjectList({
  workspaceId,
  showCreateForm = true,
}: {
  workspaceId: string;
  showCreateForm?: boolean;
}) {
  const projects = useProjects(workspaceId);
  const createProject = useCreateProject(workspaceId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    createProject.mutate(
      { workspaceId, name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: () => {
          setName("");
          setDescription("");
        },
      },
    );
  }

  return (
    <aside className="grid content-start gap-4">
      {showCreateForm ? (
        <Card>
          <CardBody>
            <form className="grid gap-3" onSubmit={submit}>
              <Field label="Project name">
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="MVP app" />
              </Field>
              <Field label="Description">
                <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What this software project is for" />
              </Field>
              <Button type="submit" disabled={createProject.isPending}>
                Create project
              </Button>
            </form>
          </CardBody>
        </Card>
      ) : null}

      {projects.isLoading ? <ProjectsSkeleton /> : null}
      {projects.isError ? <ErrorState message="Could not load projects." /> : null}
      {projects.data?.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState title="No projects" description="Start from a rough idea and turn it into a project board." />
            <div className="mt-4 flex justify-center">
              <Link href={`/project-ideas/new?workspaceId=${workspaceId}`}>
                <Button variant="secondary">Start from an Idea</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : null}
      <div className="grid gap-2">
        {projects.data?.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}?view=board`}
            className="rounded-2xl border border-[#E5E7EB] bg-white p-4 text-left transition hover:border-[#4F46E5]/40 hover:shadow-sm"
          >
            <div className="font-semibold text-[#111827]">{project.name}</div>
            {project.description ? <p className="mt-1 line-clamp-2 text-sm text-[#6B7280]">{project.description}</p> : null}
            <p className="mt-3 text-sm font-medium text-[#4F46E5]">Open Kanban</p>
          </Link>
        ))}
      </div>
    </aside>
  );
}
