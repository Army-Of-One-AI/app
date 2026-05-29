"use client";

import { useEffect, useRef, useState } from "react";
import { AgentRunList } from "@/features/agent-runs/ui/agent-run-list";
import { getRoleDisplayName, isCoreTeamRole } from "@/features/agent-roles/core-team";
import { useAgentRoles } from "@/features/agent-roles/hooks/use-agent-roles";
import { RoleSections } from "@/features/agent-roles/ui/role-sections";
import { useBoard } from "@/features/boards/hooks/use-boards";
import type { BoardColumn } from "@/features/boards/types";
import {
  Button,
  EmptyState,
  ErrorState,
  Field,
  Input,
  InspectorPanel,
  InspectorSection,
  PriorityBadge,
  RoleBadge,
  Select,
  Skeleton,
  StatusBadge,
  Textarea,
} from "@/shared/ui/components";
import { useCreateTaskComment, useMoveTask, useTask, useTaskComments, useUpdateTask } from "../hooks/use-tasks";
import type { TaskPriority, TaskStatus } from "../types";

const priorities: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const statuses: TaskStatus[] = ["BACKLOG", "READY", "IN_PROGRESS", "REVIEW", "TESTING", "DONE"];

function normalizedColumnName(column: BoardColumn) {
  return column.name.trim().toUpperCase().replace(/[\s-]+/g, "_");
}

export function TaskInspectorPanel({
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
  const board = useBoard(boardId);
  const updateTask = useUpdateTask(projectId, boardId);
  const moveTask = useMoveTask(projectId, boardId);
  const createComment = useCreateTaskComment(taskId);
  const panelRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (taskId && task.isError) onClose();
  }, [onClose, task.isError, taskId]);

  useEffect(() => {
    if (!taskId) return;

    function handlePointerDown(event: PointerEvent) {
      const panel = panelRef.current;
      if (!panel || !(event.target instanceof Node)) return;
      if (!panel.contains(event.target)) onClose();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onClose, taskId]);

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

  function changeStatus(status: TaskStatus) {
    setForm((current) => ({ ...current, status }));
    if (!taskId || !task.data) return;

    const matchingColumn = board.data?.columns?.find((column) => normalizedColumnName(column) === status);
    if (matchingColumn) {
      moveTask.mutate({
        id: taskId,
        input: {
          columnId: matchingColumn.id,
          order: task.data.order,
          status,
        },
      });
      return;
    }

    updateTask.mutate({
      id: taskId,
      input: { status },
    });
  }

  function addComment() {
    if (!taskId || !comment.trim()) return;
    createComment.mutate({ content: comment.trim() }, { onSuccess: () => setComment("") });
  }

  if (!taskId) {
    return (
      <div ref={panelRef} className="h-full">
        <InspectorPanel title="No selection" subtitle="Select a task to inspect and control execution.">
          <EmptyState title="Select a task" description="Task details, comments, notes, and team role runs appear here." />
        </InspectorPanel>
      </div>
    );
  }

  if (task.isLoading) {
    return (
      <div ref={panelRef} className="h-full">
        <InspectorPanel title="Loading task">
          <div role="status" aria-busy="true" aria-label="Loading task" className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="border-b border-[#E5E7EB] py-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-3 h-10 w-full" />
                <Skeleton className="mt-3 h-20 w-full" />
              </div>
            ))}
          </div>
        </InspectorPanel>
      </div>
    );
  }

  if (task.isError || !task.data) {
    return (
      <div ref={panelRef} className="h-full">
        <InspectorPanel title="Task unavailable">
          <ErrorState message="Could not load task." />
        </InspectorPanel>
      </div>
    );
  }

  return (
    <div ref={panelRef} className="h-full">
      <InspectorPanel
        title={task.data.title}
        subtitle={task.data.assignee_role?.name ?? "Unassigned"}
        footer={
          <div className="grid gap-2">
            {updateTask.isPending || moveTask.isPending ? <p className="text-center text-xs text-[#6B7280]">Saving changes</p> : null}
            {updateTask.isError || moveTask.isError ? <p className="text-center text-xs text-[#EF4444]">Change failed and was rolled back.</p> : null}
            <Button className="w-full" onClick={save} disabled={updateTask.isPending}>
              Save task
            </Button>
          </div>
        }
      >
      <div className="mb-4 flex justify-end">
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <PriorityBadge priority={task.data.priority} />
        <StatusBadge status={task.data.status} />
        <RoleBadge role={task.data.assignee_role?.role ?? task.data.assignee_role?.name} />
      </div>

      <InspectorSection title="Task">
        <div className="grid gap-3">
          <Field label="Title">
            <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </Field>
          <Field label="Description">
            <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <Select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as TaskPriority })}>
                {priorities.map((priority) => <option key={priority}>{priority}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(event) => changeStatus(event.target.value as TaskStatus)}>
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Assigned role">
            <Select value={form.assigneeRoleId} onChange={(event) => setForm({ ...form, assigneeRoleId: event.target.value })}>
              <option value="">Unassigned</option>
              {roles.data?.filter(isCoreTeamRole).map((role) => <option key={role.id} value={role.id}>{getRoleDisplayName(role.role)}</option>)}
            </Select>
          </Field>
        </div>
      </InspectorSection>

      <InspectorSection title="Execution notes">
        <div className="grid gap-3">
          <Field label="Acceptance criteria">
            <Textarea value={form.acceptanceCriteria} onChange={(event) => setForm({ ...form, acceptanceCriteria: event.target.value })} />
          </Field>
          <Field label="Technical notes">
            <Textarea value={form.technicalNotes} onChange={(event) => setForm({ ...form, technicalNotes: event.target.value })} />
          </Field>
          <Field label="Test cases">
            <Textarea value={form.testCases} onChange={(event) => setForm({ ...form, testCases: event.target.value })} />
          </Field>
        </div>
      </InspectorSection>

      <InspectorSection title="Core team roles">
        <RoleSections workspaceId={workspaceId} taskId={task.data.id} />
      </InspectorSection>

      <InspectorSection title="Comments">
        <div className="grid gap-3">
          <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a task comment" />
          <Button variant="ghost" onClick={addComment} disabled={createComment.isPending}>Add comment</Button>
          {comments.data?.length === 0 ? <EmptyState title="No comments" /> : null}
          {comments.data?.map((item) => (
            <div key={item.id} className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FC] p-3">
              <p className="text-xs font-medium text-[#6B7280]">{item.agent?.name ?? "Founder"}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[#111827]">{item.content}</p>
            </div>
          ))}
        </div>
      </InspectorSection>

      <InspectorSection title="Team role runs">
        <AgentRunList taskId={task.data.id} />
      </InspectorSection>
      </InspectorPanel>
    </div>
  );
}
