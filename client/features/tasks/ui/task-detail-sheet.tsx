"use client";

import { useEffect, useState } from "react";
import { AgentRunList } from "@/features/agent-runs/ui/agent-run-list";
import { getRoleDisplayName, isCoreTeamRole } from "@/features/agent-roles/core-team";
import { Badge, Button, Card, CardBody, EmptyState, ErrorState, Field, Input, Select, Sheet, Skeleton, Textarea } from "@/shared/ui/components";
import { useAgentRoles } from "@/features/agent-roles/hooks/use-agent-roles";
import { RoleSections } from "@/features/agent-roles/ui/role-sections";
import { useCreateTaskComment, useTask, useTaskComments, useUpdateTask } from "../hooks/use-tasks";
import type { TaskPriority, TaskStatus } from "../types";

const priorities: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const statuses: TaskStatus[] = ["BACKLOG", "READY", "IN_PROGRESS", "REVIEW", "TESTING", "DONE"];

export function TaskDetailSheet({
  taskId,
  projectId,
  boardId,
  workspaceId,
  onClose,
}: {
  taskId: string | undefined;
  projectId: string | undefined;
  boardId: string | undefined;
  workspaceId: string;
  onClose: () => void;
}) {
  const task = useTask(taskId);
  const comments = useTaskComments(taskId);
  const roles = useAgentRoles(workspaceId);
  const updateTask = useUpdateTask(projectId, boardId);
  const createComment = useCreateTaskComment(taskId);
  const [comment, setComment] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    acceptanceCriteria: "",
    technicalNotes: "",
    testCases: "",
    priority: "MEDIUM" as TaskPriority,
    status: "BACKLOG" as TaskStatus,
    assigneeRoleId: "",
  });

  useEffect(() => {
    if (!task.data) return;
    setForm({
      title: task.data.title,
      description: task.data.description ?? "",
      acceptanceCriteria: task.data.acceptance_criteria ?? "",
      technicalNotes: task.data.technical_notes ?? "",
      testCases: task.data.test_cases ?? "",
      priority: task.data.priority,
      status: task.data.status,
      assigneeRoleId: task.data.assignee_role_id ?? "",
    });
  }, [task.data]);

  function save() {
    if (!taskId || !form.title.trim()) return;
    updateTask.mutate({
      id: taskId,
      input: {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        acceptanceCriteria: form.acceptanceCriteria.trim() || undefined,
        technicalNotes: form.technicalNotes.trim() || undefined,
        testCases: form.testCases.trim() || undefined,
        priority: form.priority,
        status: form.status,
        assigneeRoleId: form.assigneeRoleId || undefined,
      },
    });
  }

  function addComment() {
    if (!taskId || !comment.trim()) return;
    createComment.mutate({ content: comment.trim() }, { onSuccess: () => setComment("") });
  }

  return (
    <Sheet open={Boolean(taskId)} title={task.data?.title ?? "Task detail"} onClose={onClose}>
      {task.isLoading ? (
        <div role="status" aria-busy="true" aria-label="Loading task" className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index}>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-2 h-10 w-full" />
            </div>
          ))}
        </div>
      ) : null}
      {task.isError ? <ErrorState message="Could not load task." /> : null}
      {task.data ? (
        <div className="grid gap-6">
          <section className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge tone="pink">{task.data.priority}</Badge>
              <Badge tone="cyan">{task.data.status}</Badge>
              <Badge>{task.data.assignee_role?.name ?? "Unassigned"}</Badge>
            </div>
            <Field label="Title">
              <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </Field>
            <Field label="Description">
              <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Priority">
                <Select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as TaskPriority })}>
                  {priorities.map((priority) => <option key={priority}>{priority}</option>)}
                </Select>
              </Field>
              <Field label="Status">
                <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as TaskStatus })}>
                  {statuses.map((status) => <option key={status}>{status}</option>)}
                </Select>
              </Field>
              <Field label="Assigned role">
                <Select value={form.assigneeRoleId} onChange={(event) => setForm({ ...form, assigneeRoleId: event.target.value })}>
                  <option value="">Unassigned</option>
                  {roles.data?.filter(isCoreTeamRole).map((role) => <option key={role.id} value={role.id}>{getRoleDisplayName(role.role)}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Acceptance criteria">
              <Textarea value={form.acceptanceCriteria} onChange={(event) => setForm({ ...form, acceptanceCriteria: event.target.value })} />
            </Field>
            <Field label="Technical notes">
              <Textarea value={form.technicalNotes} onChange={(event) => setForm({ ...form, technicalNotes: event.target.value })} />
            </Field>
            <Field label="Test cases">
              <Textarea value={form.testCases} onChange={(event) => setForm({ ...form, testCases: event.target.value })} />
            </Field>
            <Button onClick={save} disabled={updateTask.isPending}>Save task</Button>
          </section>

          <section className="grid gap-3">
            <h3 className="text-base font-semibold text-[#364F6B]">Core team roles</h3>
            <RoleSections workspaceId={workspaceId} taskId={task.data.id} />
          </section>

          <section className="grid gap-3">
            <h3 className="text-base font-semibold text-[#364F6B]">Comments</h3>
            <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a task comment" />
            <Button variant="ghost" onClick={addComment} disabled={createComment.isPending}>Add comment</Button>
            {comments.isLoading ? (
              <div role="status" aria-busy="true" aria-label="Loading comments" className="grid gap-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index}>
                    <CardBody>
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="mt-2 h-4 w-4/5" />
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : null}
            {comments.data?.length === 0 ? <EmptyState title="No comments" /> : null}
            {comments.data?.map((item) => (
              <Card key={item.id}>
                <CardBody>
                  <p className="text-sm text-slate-500">{item.agent?.name ?? "User"}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{item.content}</p>
                </CardBody>
              </Card>
            ))}
          </section>

          <section className="grid gap-3">
            <h3 className="text-base font-semibold text-[#364F6B]">Team role runs</h3>
            <AgentRunList taskId={task.data.id} />
          </section>
        </div>
      ) : null}
    </Sheet>
  );
}
