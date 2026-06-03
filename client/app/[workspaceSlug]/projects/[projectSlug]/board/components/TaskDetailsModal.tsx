"use client";

import { Task } from "@/features/tasks/types";
import { TaskPriority, TaskStatus } from "@/shared/types/enums";
import RichTextEditor from "@/shared/ui/RichTextEditor";
import Button from "@/shared/ui/Button";
import {
  CalendarDays,
  ChevronDown,
  Link2,
  MoreHorizontal,
  Plus,
  Settings,
  Share2,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";

type Props = {
  task: Task;
  canUpdateTask: boolean;
  canAssignTask: boolean;
  onClose: () => void;
  onUpdate: (task: Task) => void;
};

export default function TaskDetailsModal({
  task,
  canUpdateTask,
  canAssignTask,
  onClose,
  onUpdate,
}: Props) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(
    task.description ?? {
      html: "",
      plainText: "",
    }
  );
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(
    task.dueDate ? task.dueDate.slice(0, 10) : ""
  );
  const [estimate, setEstimate] = useState(task.estimate?.toString() ?? "");

  const disabled = !canUpdateTask;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onUpdate({
      ...task,
      title: title.trim(),
      description: description.plainText.trim() ? description : null,
      status,
      priority,
      dueDate: dueDate || null,
      estimate: estimate ? Number(estimate) : null,
    });
  };

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
            className="w-full bg-transparent text-2xl font-semibold text-[var(--text-primary)] outline-none"
          />

          <div>
            <h3 className="mb-2 font-semibold text-[var(--text-primary)]">
              Description
            </h3>
            <RichTextEditor value={description} onChange={setDescription} />
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
                className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-secondary)]"
              />
            </div>
          </div>
        </section>

        <aside className="space-y-3">
          <select
            disabled={disabled}
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none"
          >
            {Object.values(TaskStatus).map((val) => (
              <option key={val} value={val}>
                {val.split("_").join(" ")}
              </option>
            ))}
          </select>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <h3 className="font-semibold text-[var(--text-primary)]">
                Details
              </h3>
            </div>

            <div className="space-y-5 px-5 py-5 text-sm">
              <DetailRow label="Assignee">
                {task.assignee?.fullName ?? "Unassigned"}
              </DetailRow>

              <DetailRow label="Priority">
                <select
                  disabled={disabled}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="bg-transparent outline-none"
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
                  className="bg-transparent outline-none"
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
                  className="w-24 bg-transparent outline-none"
                />
              </DetailRow>

              <DetailRow label="Reporter">
                {task.creator?.fullName ?? "Unknown"}
              </DetailRow>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 font-semibold">
            Development
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 font-semibold">
            Automation
          </div>

          <Button
            type="submit"
            disabled={disabled || !title.trim()}
            className="w-full"
          >
            Save changes
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
      <span className="font-semibold text-[#18191a]">{label}</span>
      <div className="text-[#4d4d4d]">{children}</div>
    </div>
  );
}

function CollapseCard({ title }: { title: string }) {
  return (
    <div className="flex h-12 items-center gap-2 rounded-lg border border-white/10 px-4 font-semibold">
      <ChevronDown size={16} className="-rotate-90" />
      {title}
    </div>
  );
}

function IconButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded border border-white/10 text-[#a9adb5] transition hover:bg-white/5 hover:text-white"
    >
      {children}
    </button>
  );
}
