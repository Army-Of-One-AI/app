/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { classNames } from "@/shared/styles/classNames";
import { AlertTriangle, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

export default function DeleteWorkspaceModal({
  isOpen,
  isLoading,
  workspaceName,
  workspaceSlug,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  isLoading: boolean;
  workspaceName: string;
  workspaceSlug: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [confirmSlug, setConfirmSlug] = useState("");

  const canDelete = confirmSlug.trim() === workspaceSlug;

  useEffect(() => {
    if (!isOpen) {
      setConfirmSlug("");
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.button
            type="button"
            aria-label="Close delete workspace modal"
            onClick={onClose}
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="
              relative w-full max-w-xl
              rounded-2xl
              border border-(--border)
              bg-background
              p-6
              shadow-lg
            "
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                <AlertTriangle size={20} />
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-semibold">Delete workspace</h2>

                <p className={`mt-2 text-sm ${classNames.text.secondary}`}>
                  This action cannot be undone. This will permanently delete the
                  workspace{" "}
                  <span className="font-semibold text-[var(--foreground)]">
                    {workspaceName}
                  </span>{" "}
                  and remove all associated projects, tasks, documents, members,
                  and settings.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className={`
                  rounded-lg p-1
                  hover:bg-[var(--secondary)]
                  disabled:opacity-60
                  ${classNames.text.secondary}
                `}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-8">
              <label className="mb-2 block text-sm font-medium">
                To confirm, type{" "}
                <span className="font-mono font-semibold">
                  {`"${workspaceSlug}"`}
                </span>{" "}
                in the box below
              </label>

              <input
                value={confirmSlug}
                onChange={(event) => setConfirmSlug(event.target.value)}
                placeholder={workspaceSlug}
                autoFocus
                disabled={isLoading}
                className="
                  w-full rounded-lg
                  border border-red-500/30
                  bg-[var(--background)]
                  px-3 py-2.5
                  text-sm
                  outline-none
                  focus:border-red-400
                  disabled:opacity-60
                "
              />

              <button
                type="button"
                onClick={onConfirm}
                disabled={!canDelete || isLoading}
                className="
                  mt-4 w-full
                  rounded-lg
                  bg-red-600
                  py-2.5
                  text-sm font-semibold
                  text-white
                  transition-colors

                  hover:bg-red-500

                  disabled:cursor-not-allowed
                  disabled:bg-red-600/40
                  disabled:text-white/60
                "
              >
                {isLoading ? "Deleting workspace..." : "Delete this workspace"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
