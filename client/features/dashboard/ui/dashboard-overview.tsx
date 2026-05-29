"use client";

import Link from "next/link";
import { ProjectsSkeleton } from "@/features/projects/ui/projects-skeleton";
import { useAllProjects } from "@/features/projects/hooks/use-projects";
import { useAllTasks } from "@/features/tasks/hooks/use-tasks";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";
import { AppShell, Badge, Button, Card, CardBody, EmptyState, ErrorState, Skeleton } from "@/shared/ui/components";

export function DashboardOverview() {
  const workspaces = useWorkspaces();
  const projects = useAllProjects();
  const tasks = useAllTasks();
  const latestProject = projects.data?.[0];
  const latestWorkspace = workspaces.data?.[0];
  const activeTasks = tasks.data?.filter((task) => task.status !== "DONE") ?? [];
  const recentProjects = projects.data?.slice(0, 5) ?? [];
  const recentTasks = tasks.data?.slice(0, 6) ?? [];

  return (
    <AppShell title="Dashboard" eyebrow="Home">
      <div className="grid gap-5">
        <section className="grid gap-3 md:grid-cols-3">
          <Card>
            <CardBody>
              <p className="text-sm text-[#6B7280]">Workspaces</p>
              {workspaces.isLoading ? <Skeleton className="mt-3 h-9 w-16" /> : <p className="mt-2 text-3xl font-semibold text-[#111827]">{workspaces.data?.length ?? 0}</p>}
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-[#6B7280]">Projects</p>
              {projects.isLoading ? <Skeleton className="mt-3 h-9 w-16" /> : <p className="mt-2 text-3xl font-semibold text-[#111827]">{projects.data?.length ?? 0}</p>}
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-[#6B7280]">Active tasks</p>
              {tasks.isLoading ? <Skeleton className="mt-3 h-9 w-16" /> : <p className="mt-2 text-3xl font-semibold text-[#111827]">{activeTasks.length}</p>}
            </CardBody>
          </Card>
        </section>

        <section className="grid gap-3">
          <h2 className="text-lg font-semibold text-[#111827]">Quick actions</h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/workspaces">
              <Button>Create workspace</Button>
            </Link>
            <Link href={latestWorkspace ? `/workspaces/${latestWorkspace.id}` : "/workspaces"}>
              <Button variant="ghost">Create project</Button>
            </Link>
            <Link href={latestWorkspace ? `/project-ideas/new?workspaceId=${latestWorkspace.id}` : "/project-ideas/new"}>
              <Button variant="secondary">Start from an Idea</Button>
            </Link>
            <Link href={latestProject ? `/projects/${latestProject.id}?view=board` : "/workspaces"}>
              <Button variant="ghost">Open latest project</Button>
            </Link>
          </div>
        </section>

        {workspaces.isError || projects.isError || tasks.isError ? <ErrorState message="Could not load dashboard overview." /> : null}

        <section className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardBody>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-[#111827]">Recent projects</h2>
                <Link className="text-sm font-medium text-[#4F46E5]" href="/workspaces">
                  Manage
                </Link>
              </div>
              {projects.isLoading ? <ProjectsSkeleton /> : null}
              {!projects.isLoading ? <div className="grid gap-2">
                {recentProjects.length === 0 ? <EmptyState title="No projects yet" description="Create a workspace, then add a project." /> : null}
                {recentProjects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}?view=board`} className="rounded-xl border border-[#E5E7EB] p-3 hover:border-[#4F46E5]/40">
                    <p className="font-medium text-[#111827]">{project.name}</p>
                    {project.description ? <p className="mt-1 line-clamp-1 text-sm text-[#6B7280]">{project.description}</p> : null}
                  </Link>
                ))}
              </div> : null}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2 className="mb-3 font-semibold text-[#111827]">Recent tasks</h2>
              {tasks.isLoading ? (
                <div role="status" aria-busy="true" aria-label="Loading recent tasks" className="grid gap-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="rounded-xl border border-[#E5E7EB] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <Skeleton className="h-4 w-3/5" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                      <Skeleton className="mt-3 h-4 w-24" />
                    </div>
                  ))}
                </div>
              ) : null}
              {!tasks.isLoading ? <div className="grid gap-2">
                {recentTasks.length === 0 ? <EmptyState title="No tasks yet" description="Tasks appear here after you create them on a board." /> : null}
                {recentTasks.map((task) => (
                  <div key={task.id} className="rounded-xl border border-[#E5E7EB] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-[#111827]">{task.title}</p>
                      <Badge tone={task.status === "DONE" ? "green" : "cyan"}>{task.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-[#6B7280]">{task.priority}</p>
                  </div>
                ))}
              </div> : null}
            </CardBody>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
