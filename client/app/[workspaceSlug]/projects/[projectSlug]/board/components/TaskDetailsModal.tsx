"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Task } from "@/features/tasks/types";
import { TaskPriority, TaskStatus } from "@/shared/types/enums";
import RichTextEditor from "@/shared/ui/RichTextEditor";
import Button from "@/shared/ui/Button";
import useGetTaskById from "@/features/tasks/hooks/useGetTaskById";
import useUpdateTask from "@/features/tasks/hooks/useUpdateTask";
import { parseRichText } from "@/shared/utils/helpers";
import { ProjectMember } from "@/features/projects/types";
import { classNames } from "@/shared/styles/classNames";

type Props = {
  taskId: string;
  canUpdateTask: boolean;
  canAssignTask: boolean;
  members: ProjectMember[];
  onClose: () => void;
  onUpdate: (task: Task) => void;
};

type TaskDescription = {
  html: string;
  plainText: string;
};

const emptyDescription: TaskDescription = {
  html: "",
  plainText: "",
};

const inlineControlClassName =
  "bg-transparent outline-none disabled:cursor-not-allowed disabled:opacity-70";

export default function TaskDetailsModal({
  taskId,
  members,
  canUpdateTask,
  canAssignTask,
  onClose,
  onUpdate,
}: Props) {
  const params = useParams();

  const workspaceSlug = params.workspaceSlug as string;
  const projectSlug = params.projectSlug as string;

  const {
    data: task,
    isLoading,
    isError,
  } = useGetTaskById(taskId, projectSlug, workspaceSlug);

  const { mutateAsync: updateTask, isPending } = useUpdateTask();

  const [loadedTaskId, setLoadedTaskId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState<TaskDescription>(emptyDescription);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.Todo);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.Medium);
  const [dueDate, setDueDate] = useState("");
  const [estimate, setEstimate] = useState("");

  const [assigneeId, setAssigneeId] = useState("");
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");

  const disabled = !canUpdateTask || isPending;

  const selectedAssignee = useMemo(() => {
    return members.find((member) => member.id === assigneeId) ?? null;
  }, [members, assigneeId]);

  const filteredMembers = useMemo(() => {
    const keyword = assigneeSearch.toLowerCase().trim();

    if (!keyword) return members;

    return members.filter((member) =>
      [member.fullName, member.username, member.email]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(keyword))
    );
  }, [members, assigneeSearch]);

  useEffect(() => {
    if (!task) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(task.title);
    setDescription(parseRichText(task.description));
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
    setEstimate(task.estimate?.toString() ?? "");
    setAssigneeId(task.assignee?.id ?? "");
    setIsAssigneeOpen(false);
    setAssigneeSearch("");
    setLoadedTaskId(task.id);
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!task || !title.trim()) return;

    const updatedTask = await updateTask({
      workspaceSlug,
      projectSlug,
      taskId,

      title: title.trim(),
      description: description.plainText.trim() ? description : null,
      status,
      priority,
      dueDate: dueDate || null,
      estimate: estimate ? Number(estimate) : null,
      assigneeId: assigneeId || null,
    });

    onUpdate(updatedTask);
    onClose();
  };

  if (isLoading || !task || loadedTaskId !== task.id) {
    return (
      <div className={`flex h-[82vh] w-[92vw] max-w-305 items-center justify-center text-sm ${classNames.text.secondary}`}>
        Loading task...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[82vh] w-[92vw] max-w-305 flex-col items-center justify-center gap-3">
        <p className={`text-sm ${classNames.text.secondary}`}>
          Failed to load task.
        </p>

        <Button type="button" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-[82vh] w-[92vw] max-w-305 flex-col overflow-hidden"
    >
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_420px] gap-8 overflow-y-auto px-7 py-6">
        <section className="min-w-0 space-y-7">
          <input
            disabled={disabled}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full text-2xl font-semibold ${classNames.text.primary} ${inlineControlClassName}`}
          />

          <div>
            <h3 className="mb-2 font-semibold text-[var(--text-primary)]">
              Description
            </h3>

            <RichTextEditor
              key={task.id}
              value={description}
              onChange={setDescription}
            />
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-[var(--text-primary)]">
              Subtasks
            </h3>

            <div className="h-2 rounded-full bg-[var(--primary)]" />

            <div className="mt-3 overflow-hidden rounded-lg border border-[var(--border)]">
              <div className="grid grid-cols-[1fr_90px_90px_140px] bg-[var(--secondary)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]">
                <span>Work</span>
                <span>Pri...</span>
                <span>As...</span>
                <span>Status</span>
              </div>

              <div className="grid grid-cols-[1fr_90px_90px_140px] px-3 py-3 text-sm text-[var(--text-secondary)]">
                <span className="text-[var(--primary)]">+ Create subtask</span>
                <span>None</span>
                <span>—</span>
                <span>None</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-[var(--text-primary)]">
              Activity
            </h3>

            <div className="rounded-lg border border-[var(--border)] p-4">
              <input
                placeholder="Add a comment..."
                className={`w-full text-sm ${classNames.input.text} ${classNames.input.placeholder} ${inlineControlClassName}`}
              />
            </div>
          </div>
        </section>

        <aside className="space-y-3">
          <select
            disabled={disabled}
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-70"
          >
            {Object.values(TaskStatus).map((val) => (
              <option key={val} value={val}>
                {val.split("_").join(" ")}
              </option>
            ))}
          </select>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="border-b border-[var(--border)] px-4 py-3">
              <h3 className="font-semibold text-[var(--text-primary)]">
                Details
              </h3>
            </div>

            <div className="space-y-5 px-5 py-5 text-sm">
              <DetailRow label="Assignee">
                <div className="relative">
                  <button
                    type="button"
                    disabled={!canAssignTask || isPending}
                    onClick={() => setIsAssigneeOpen((curr) => !curr)}
                    className="flex w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left hover:bg-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {selectedAssignee ? (
                      <>
                        <MemberAvatar member={selectedAssignee} size="sm" />

                        <span className="min-w-0 flex-1 truncate text-[var(--text-primary)]">
                          {selectedAssignee.fullName ||
                            selectedAssignee.username}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--secondary)] text-xs font-semibold text-[var(--text-secondary)]">
                          —
                        </div>

                        <span className="text-[var(--text-secondary)]">
                          Unassigned
                        </span>
                      </>
                    )}
                  </button>

                  {isAssigneeOpen && (
                    <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg">
                      <div className="border-b border-[var(--border)] p-2">
                        <input
                          autoFocus
                          value={assigneeSearch}
                          onChange={(e) => setAssigneeSearch(e.target.value)}
                          placeholder="Search member..."
                          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${classNames.input.bg} ${classNames.input.border} ${classNames.input.text} ${classNames.input.placeholder} ${classNames.input.focus}`}
                        />
                      </div>

                      <div className="max-h-60 overflow-y-auto py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setAssigneeId("");
                            setIsAssigneeOpen(false);
                            setAssigneeSearch("");
                          }}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[var(--secondary)]"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--secondary)] text-sm font-semibold text-[var(--text-secondary)]">
                            —
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-medium text-[var(--text-primary)]">
                              Unassigned
                            </p>
                            <p className="truncate text-xs text-[var(--text-secondary)]">
                              No assignee
                            </p>
                          </div>
                        </button>

                        {filteredMembers.map((member) => {
                          const isSelected = member.id === assigneeId;

                          return (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => {
                                setAssigneeId(member.id);
                                setIsAssigneeOpen(false);
                                setAssigneeSearch("");
                              }}
                              className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[var(--secondary)]"
                            >
                              <MemberAvatar member={member} size="md" />

                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-[var(--text-primary)]">
                                  {member.fullName || member.username}
                                </p>

                                <p className="truncate text-xs text-[var(--text-secondary)]">
                                  {member.email}
                                </p>
                              </div>

                              {isSelected && (
                                <span className="text-xs font-semibold text-[var(--primary)]">
                                  Selected
                                </span>
                              )}
                            </button>
                          );
                        })}

                        {filteredMembers.length === 0 && (
                          <div className="px-3 py-5 text-center text-sm text-[var(--text-secondary)]">
                            No members found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </DetailRow>

              <DetailRow label="Priority">
                <select
                  disabled={disabled}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className={inlineControlClassName}
                >
                  {Object.values(TaskPriority).map((val) => (
                    <option key={val} value={val}>
                      {val}
                    </option>
                  ))}
                </select>
              </DetailRow>

              <DetailRow label="Parent">None</DetailRow>

              <DetailRow label="Due date">
                <input
                  disabled={disabled}
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={inlineControlClassName}
                />
              </DetailRow>

              <DetailRow label="Labels">None</DetailRow>

              <DetailRow label="Estimate">
                <input
                  disabled={disabled}
                  type="number"
                  min={0}
                  value={estimate}
                  onChange={(e) => setEstimate(e.target.value)}
                  placeholder="None"
                  className={`w-24 ${inlineControlClassName}`}
                />
              </DetailRow>

              <DetailRow label="Reporter">
                {task.creator?.fullName ?? "Unknown"}
              </DetailRow>
            </div>
          </div>

          <Button
            type="submit"
            disabled={disabled || !title.trim()}
            className="w-full"
          >
            {isPending ? "Saving..." : "Save changes"}
          </Button>
        </aside>
      </div>
    </form>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4">
      <span className="font-semibold text-[var(--text-primary)]">{label}</span>
      <div className="min-w-0 text-[var(--text-secondary)]">{children}</div>
    </div>
  );
}

function MemberAvatar({
  member,
  size,
}: {
  member: ProjectMember;
  size: "sm" | "md";
}) {
  const className =
    size === "sm"
      ? "h-6 w-6 rounded-full object-cover"
      : "h-8 w-8 rounded-full object-cover";

  const fallbackClassName =
    size === "sm"
      ? "flex h-6 w-6 items-center justify-center rounded-full bg-[var(--secondary)] text-xs font-semibold text-[var(--text-secondary)]"
      : "flex h-8 w-8 items-center justify-center rounded-full bg-[var(--secondary)] text-xs font-semibold text-[var(--text-secondary)]";

  if (member.avatarURL) {
    return (
      <img
        src={member.avatarURL}
        alt={member.fullName || member.username}
        className={className}
      />
    );
  }

  return (
    <div className={fallbackClassName}>
      {getInitial(member.fullName || member.username)}
    </div>
  );
}

function getInitial(value: string) {
  return value.trim().charAt(0).toUpperCase();
}
