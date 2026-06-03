"use client";

import { TaskPriority, TaskStatus } from "@/shared/types/enums";
import { classNames } from "@/shared/styles/classNames";
import RichTextEditor from "@/shared/ui/RichTextEditor";
import Button from "@/shared/ui/Button";
import { useState } from "react";

export type TaskDescription = {
  html: string;
  plainText: string;
};

type Props = {
  onClose: () => void;
  onCreate: (values: CreateTaskFormValues) => void;
  defaultStatus?: TaskStatus;
  isLoading?: boolean;
};

export type CreateTaskFormValues = {
  title: string;
  description?: TaskDescription;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  estimate?: number;
};

export default function CreateTaskModal({
  onClose,
  onCreate,
  defaultStatus = TaskStatus.Todo,
  isLoading = false,
}: Props) {
  const [title, setTitle] = useState("");

  const [description, setDescription] = useState<TaskDescription>({
    html: "",
    plainText: "",
  });

  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.Medium);
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [dueDate, setDueDate] = useState("");
  const [estimate, setEstimate] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title.trim()) return;

    onCreate({
      title: title.trim(),
      priority,
      status,
      ...(description.plainText.trim() && { description }),
      ...(dueDate && { dueDate }),
      ...(estimate && { estimate: Number(estimate) }),
    });

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="w-125 max-w-[100vw] space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          className={`h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none ${classNames.border}`}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <RichTextEditor value={description} onChange={setDescription} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className={`h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none ${classNames.border}`}
          >
            {Object.values(TaskStatus).map((val) => (
              <option key={val} value={val}>
                {val.split("_").join(" ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className={`h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none ${classNames.border}`}
          >
            {Object.values(TaskPriority).map((val) => (
              <option key={val} value={val}>
                {val.split("_").join(" ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Due date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={`h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none ${classNames.border}`}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Estimate</label>
          <input
            type="number"
            min={0}
            value={estimate}
            onChange={(e) => setEstimate(e.target.value)}
            placeholder="Hours"
            className={`h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none ${classNames.border}`}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]"
        >
          Cancel
        </button>

        <Button type="submit" disabled={isLoading || !title.trim()}>
          {isLoading ? "Creating..." : "Create task"}
        </Button>
      </div>
    </form>
  );
}
