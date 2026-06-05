"use client";

import { Archive, AlertTriangle, X } from "lucide-react";

type TaskVerifyModalMode = "delete" | "archive";

type TaskVerifyModalProps = {
  isOpen: boolean;
  mode: TaskVerifyModalMode;
  taskTitle?: string;
  subtaskCount?: number;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function TaskVerifyModal({
  isOpen,
  mode,
  taskTitle,
  subtaskCount = 0,
  isLoading = false,
  onClose,
  onConfirm,
}: TaskVerifyModalProps) {
  if (!isOpen) return null;

  const isDelete = mode === "delete";

  const title = isDelete ? "Delete task?" : "Archive task?";
  const buttonText = isDelete ? "Delete task" : "Archive task";
  const loadingText = isDelete ? "Deleting..." : "Archiving...";

  const description = isDelete
    ? subtaskCount > 0
      ? `This task and ${subtaskCount} subtasks will be moved to deleted items.`
      : "This task will be moved to deleted items."
    : subtaskCount > 0
    ? `This task and ${subtaskCount} subtasks will be removed from active project views and moved to the archive.`
    : "This task will be removed from active project views and moved to the archive.";

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[var(--overlay)] px-4">
      <div
        className={`
          w-full max-w-[440px] overflow-hidden rounded-2xl border bg-[var(--surface)] shadow-[var(--shadow-soft)]
          ${
            isDelete
              ? "border-[var(--danger-border)]"
              : "border-[var(--border)]"
          }
        `}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] p-5">
          <div className="flex gap-3">
            <div
              className={`
                flex size-10 shrink-0 items-center justify-center rounded-full border
                ${
                  isDelete
                    ? "border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger-text)]"
                    : "border-[var(--border)] bg-[var(--status-archived-bg)] text-[var(--status-archived-text)]"
                }
              `}
            >
              {isDelete ? <AlertTriangle size={20} /> : <Archive size={20} />}
            </div>

            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                {title}
              </h2>

              <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">
                {description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {taskTitle && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-3">
              <p className="line-clamp-2 text-sm font-medium text-[var(--text-primary)]">
                {taskTitle}
              </p>
            </div>
          )}

          {isDelete ? (
            <div className="mt-4 rounded-xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-4 py-3">
              <p className="text-sm leading-6 text-[var(--danger-text)]">
                Deleting hides this task from normal project views. Use archive
                instead if you may need to restore it later.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-3">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Archived tasks:
              </p>

              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-[var(--text-secondary)]">
                <li>Are hidden from active boards and task lists</li>
                <li>Keep comments, history, assignee, and status</li>
                <li>Can be restored from the archive later</li>
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--secondary)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl border border-[var(--btn-secondary-border)] bg-[var(--btn-secondary-bg)] px-4 py-2 text-sm font-medium text-[var(--btn-secondary-color)] hover:bg-[var(--btn-secondary-bg-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`
              rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50
              ${
                isDelete
                  ? "border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger-text)] hover:bg-[var(--focus-danger)]"
                  : "border-[var(--border)] bg-[var(--status-archived-bg)] text-[var(--status-archived-text)] hover:bg-[var(--secondary)]"
              }
            `}
          >
            {isLoading ? loadingText : buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
