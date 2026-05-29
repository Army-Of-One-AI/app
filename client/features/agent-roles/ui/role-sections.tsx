"use client";

import { useState } from "react";
import { Button, Card, CardBody, EmptyState, ErrorState, GenerationLoadingCard, Skeleton, Textarea } from "@/shared/ui/components";
import { useCreateAgentRun } from "@/features/agent-runs/hooks/use-agent-runs";
import { useCreateTaskComment } from "@/features/tasks/hooks/use-tasks";
import { coreTeamRoleTypes, getRoleDisplayName } from "../core-team";
import { useAgentRoles } from "../hooks/use-agent-roles";
import type { AgentRole } from "../types";

function RolePanel({ role, taskId }: { role: AgentRole; taskId: string }) {
  const [note, setNote] = useState("");
  const [runStartedAt, setRunStartedAt] = useState<Date>();
  const createComment = useCreateTaskComment(taskId);
  const createRun = useCreateAgentRun(taskId);

  function addNote() {
    if (!note.trim()) return;
    createComment.mutate(
      { agentId: role.id, content: note.trim() },
      { onSuccess: () => setNote("") },
    );
  }

  function runAgent() {
    setRunStartedAt(new Date());
    createRun.mutate({
      agentId: role.id,
      taskId,
      input: `Assist this task as the ${getRoleDisplayName(role.role)} role.`,
    }, {
      onSettled: () => setRunStartedAt(undefined),
    });
  }

  const roleName = getRoleDisplayName(role.role);

  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="font-semibold text-[#111827]">{role.name}</h4>
            <p className="text-xs text-[#6B7280]">{roleName}</p>
          </div>
          <Button variant="secondary" onClick={runAgent} disabled={createRun.isPending}>
            Run role
          </Button>
        </div>
        {createRun.isPending ? (
          <div className="mt-3">
            <GenerationLoadingCard
              title={`${roleName} is thinking through this task`}
              subtitle="Generating role-specific notes and recommendations."
              startedAt={runStartedAt}
            />
          </div>
        ) : null}
        <Textarea
          className="mt-3"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Leave role-specific notes as a task comment"
        />
        <Button className="mt-3" variant="ghost" onClick={addNote} disabled={createComment.isPending}>
          Add note
        </Button>
      </CardBody>
    </Card>
  );
}

export function RoleSections({ workspaceId, taskId }: { workspaceId: string; taskId: string }) {
  const roles = useAgentRoles(workspaceId);

  if (roles.isLoading) {
    return (
      <div role="status" aria-busy="true" aria-label="Loading core team roles" className="grid gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardBody>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-3 w-20" />
                </div>
                <Skeleton className="h-10 w-24" />
              </div>
              <Skeleton className="mt-3 h-20 w-full" />
              <Skeleton className="mt-3 h-10 w-24" />
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }
  if (roles.isError) return <ErrorState message="Could not load core team roles." />;

  const panels = coreTeamRoleTypes
    .map((roleType) => roles.data?.find((role) => role.role === roleType))
    .filter((role): role is AgentRole => Boolean(role));

  if (!panels.length) {
    return <EmptyState title="No configured team roles" description="Configure the core team roles before running them from tasks." />;
  }

  return (
    <div className="grid gap-3">
      {panels.map((role) => (
        <RolePanel key={role.id} role={role} taskId={taskId} />
      ))}
    </div>
  );
}
