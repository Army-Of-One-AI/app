import { classNames } from "@/shared/styles/classNames";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const APP_HOST = APP_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");

export default function WorkspaceUrlModal({
  isOpen,
  draftSlug,
  isSaving,
  onClose,
  onChange,
  onConfirm,
}: {
  isOpen: boolean;
  draftSlug: string;
  isSaving: boolean;
  onClose: () => void;
  onChange: (value: string) => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.button
            type="button"
            aria-label="Close workspace URL modal"
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
            className="relative w-full max-w-lg rounded-2xl border border-(--border) bg-background p-5 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Change workspace URL</h2>
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className={`rounded-lg p-1 hover:bg-[var(--secondary)] disabled:opacity-60 ${classNames.text.secondary}`}
              >
                <X size={18} />
              </button>
            </div>

            <p className={`mt-7 text-sm ${classNames.text.secondary}`}>
              This will change all your URLs and old ones will be redirected.
            </p>

            <label className="mt-6 block text-sm font-semibold">
              Enter the new workspace URL
            </label>

            <div className="mt-3 flex rounded-lg border border-[var(--primary)] bg-[var(--background)] px-3 py-2 text-sm">
              <span className={classNames.text.secondary}>{APP_HOST}/</span>
              <input
                value={draftSlug}
                onChange={(event) => onChange(event.target.value)}
                autoFocus
                className="min-w-0 flex-1 bg-transparent font-semibold outline-none"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="rounded-lg bg-[var(--secondary)] px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={isSaving || !draftSlug.trim()}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSaving ? "Updating..." : "Update"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
