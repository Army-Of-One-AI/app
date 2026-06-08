"use client";

import useCreateEpic from "@/features/projects/hooks/useCreateEpic";
import { TaskDescription } from "@/features/tasks/types";
import useSlugs from "@/shared/hooks/useSlugs";
import { classNames } from "@/shared/styles/classNames";
import Button from "@/shared/ui/Button";
import RichTextEditor from "@/shared/ui/RichTextEditor";
import { X } from "lucide-react";
import { useState } from "react";

const colorPresets = [
  "#579DFF",
  "#7EE2B8",
  "#F5CD47",
  "#FEA362",
  "#F87168",
  "#C084FC",
];

export default function CreateEpicModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated?: () => void;
}) {
  const slugs = useSlugs();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState<TaskDescription>({
    html: "",
    plainText: "",
  });
  const [color, setColor] = useState("#579DFF");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  const hasInvalidDateRange =
    startDate !== "" && dueDate !== "" && new Date(dueDate) < new Date(startDate);

  const canSubmit = title.trim().length > 0 && !hasInvalidDateRange;

  const { mutateAsync: createEpic, isPending: isCreating } = useCreateEpic();

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[var(--border)] px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Create epic
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Group related tasks into a larger milestone.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!isCreating) onClose();
            }}
            disabled={isCreating}
            className="rounded-xl p-2 text-[var(--text-secondary)] hover:bg-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close create epic modal"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();

            if (!canSubmit) return;

            try {
              setError("");
              await createEpic({
                workspaceSlug: slugs.workspace.slug,
                projectSlug: slugs.project.slug,
                payload: {
                  title: title.trim(),
                  color,
                  ...(description.plainText.trim() && { description }),
                  ...(dueDate !== "" && { dueDate }),
                  ...(startDate !== "" && { startDate }),
                },
              });
              onCreated?.();
            } catch (err: unknown) {
              const message =
                err instanceof Error ? err.message : "Failed to create epic.";
              setError(message);
            }
          }}
          className="space-y-5 px-6 py-5"
        >
          {error && (
            <div className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger-text)]">
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">
              Title
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Authentication & Workspace Access"
              className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none ${classNames.input.bg} ${classNames.input.border} ${classNames.input.text} ${classNames.input.placeholder} ${classNames.input.focus}`}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">
              Description
            </label>
            <RichTextEditor value={description} onChange={setDescription} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">
              Color
            </label>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
              <div className="flex flex-wrap items-center gap-2">
                {colorPresets.map((preset) => {
                  const isSelected = color.toLowerCase() === preset.toLowerCase();

                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setColor(preset)}
                      className={`group flex h-9 w-9 items-center justify-center rounded-xl border bg-[var(--surface)] transition hover:-translate-y-0.5 hover:shadow-sm ${
                        isSelected
                          ? "border-[var(--text-primary)] ring-2 ring-[var(--primary)]/25"
                          : "border-[var(--border)]"
                      }`}
                      aria-label={`Use color ${preset}`}
                    >
                      <span
                        className="h-6 w-6 rounded-lg shadow-inner"
                        style={{ background: preset }}
                      />
                    </button>
                  );
                })}

                <label className="ml-auto inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]">
                  <span
                    className="h-4 w-4 rounded-md border border-[var(--border)]"
                    style={{ background: color }}
                  />
                  Custom
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="sr-only"
                    aria-label="Custom epic color"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">
                Start date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${classNames.input.bg} ${classNames.input.border} ${classNames.input.text} ${classNames.input.focus}`}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">
                Due date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${classNames.input.bg} ${classNames.input.border} ${classNames.input.text} ${classNames.input.focus}`}
              />
            </div>
          </div>

          {hasInvalidDateRange && (
            <p className="text-sm text-[var(--danger-text)]">
              Due date must be on or after the start date.
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-5">
            <Button
              type="button"
              variant="secondary"
              disabled={isCreating}
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={!canSubmit || isCreating}>
              {isCreating ? "Creating..." : "Create epic"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
