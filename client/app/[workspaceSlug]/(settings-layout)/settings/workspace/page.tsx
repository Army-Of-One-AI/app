/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import useWorkspaceDetailsBySlug from "@/features/workspaces/hooks/useWorkspaceDetailsBySlug";
import useSlugs from "@/shared/hooks/useSlugs";
import { classNames } from "@/shared/styles/classNames";
import { AlertTriangle, Camera, Check, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

type WorkspaceForm = {
  name: string;
  slug: string;
  logoURL: string;
  logoFile: File | null;
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const APP_HOST = APP_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");

export default function SettingsWorkspacePage() {
  const slugs = useSlugs();
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const { data, isLoading, error } = useWorkspaceDetailsBySlug(
    slugs.workspace.slug
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [draftSlug, setDraftSlug] = useState("");
  const [logoPreviewURL, setLogoPreviewURL] = useState("");

  const [form, setForm] = useState<WorkspaceForm>({
    name: "",
    slug: "",
    logoURL: "",
    logoFile: null,
  });

  useEffect(() => {
    if (!data) return;

    setForm({
      name: data.name ?? "",
      slug: data.slug ?? "",
      logoURL: data.logoURL ?? "",
      logoFile: null,
    });

    setDraftSlug(data.slug ?? "");
    setLogoPreviewURL(data.logoURL ?? "");
  }, [data]);

  const initialForm = useMemo<WorkspaceForm>(
    () => ({
      name: data?.name ?? "",
      slug: data?.slug ?? "",
      logoURL: data?.logoURL ?? "",
      logoFile: null,
    }),
    [data]
  );

  const hasChanges = form.name !== initialForm.name || !!form.logoFile;

  const workspaceInitial = (form.name || "Workspace").charAt(0).toUpperCase();

  const sanitizeSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, "");

  const handleCancel = () => {
    setForm(initialForm);
    setLogoPreviewURL(initialForm.logoURL);
  };

  const handleSelectLogo = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;

    const nextPreviewURL = URL.createObjectURL(file);

    setLogoPreviewURL((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return nextPreviewURL;
    });

    setForm((curr) => ({
      ...curr,
      logoFile: file,
    }));
  };

  const handleSaveWorkspace = async () => {
    try {
      setIsSaving(true);

      const payload = new FormData();
      payload.append("name", form.name.trim());

      if (form.logoFile) {
        payload.append("logo", form.logoFile);
      }

      // TODO: await updateWorkspace(slugs.workspace.slug, payload);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSlug = async () => {
    try {
      setIsSaving(true);

      const nextSlug = sanitizeSlug(draftSlug);

      // TODO: await updateWorkspaceSlug(slugs.workspace.slug, nextSlug);

      setForm((curr) => ({ ...curr, slug: nextSlug }));
      setIsUrlModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    try {
      setIsDeletingWorkspace(true);

      // TODO: await deleteWorkspace(slugs.workspace.slug);

      setIsDeleteModalOpen(false);
    } finally {
      setIsDeletingWorkspace(false);
    }
  };

  if (isLoading) {
    return (
      <main className="w-full max-w-3xl px-10 py-10">
        <div className="h-8 w-48 animate-pulse rounded bg-[var(--secondary)]" />
        <div className="mt-8 h-48 animate-pulse rounded-xl bg-[var(--secondary)]" />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="w-full max-w-3xl px-10 py-10">
        <h1 className="text-2xl font-semibold">Workspace</h1>
        <p className={`mt-2 text-sm ${classNames.text.secondary}`}>
          Unable to load workspace settings.
        </p>
      </main>
    );
  }

  return (
    <>
      <main className="w-full max-w-3xl px-10 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Workspace</h1>

        <section className="mt-8 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <SettingRow label="Logo" description="Recommended size is 256x256px">
            <div className="relative ml-auto">
              {logoPreviewURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreviewURL}
                  alt={form.name}
                  className="h-9 w-9 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-xs font-semibold text-white">
                  {workspaceInitial}
                </div>
              )}

              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleSelectLogo(event.target.files?.[0])}
              />

              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 transition hover:opacity-100"
              >
                <Camera size={15} className="text-white" />
              </button>
            </div>
          </SettingRow>

          <SettingRow label="Name">
            <Input
              value={form.name}
              onChange={(value) =>
                setForm((curr) => ({ ...curr, name: value }))
              }
            />
          </SettingRow>

          <SettingRow label="URL">
            <button
              type="button"
              onClick={() => {
                setDraftSlug(form.slug);
                setIsUrlModalOpen(true);
              }}
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-left text-sm outline-none hover:border-[var(--primary)]"
            >
              <span className={classNames.text.secondary}>{APP_HOST}/</span>
              <span className="font-semibold">{form.slug}</span>
            </button>
          </SettingRow>
        </section>

        <SectionTitle>Danger zone</SectionTitle>

        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center justify-between px-4 py-5">
            <div>
              <div className="text-sm font-semibold">Delete workspace</div>
              <p className={`text-sm ${classNames.text.secondary}`}>
                Schedule workspace to be permanently deleted
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="text-sm font-semibold text-red-400 hover:text-red-300"
            >
              Delete workspace
            </button>
          </div>
        </section>

        <AnimatePresence mode="wait">
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, translateX: -100 }}
              animate={{ opacity: 1, translateX: 1 }}
              exit={{ opacity: 0, translateX: -100 }}
              transition={{
                type: "spring",
                duration: 0.5,
                bounce: 0.5,
              }}
              className="
                flex items-center justify-between
                px-4 py-4 mt-2"
            >
              <span className={`text-sm ${classNames.text.secondary}`}>
                You have unsaved changes
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--secondary)] px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60"
                >
                  <X size={15} />
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveWorkspace}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                  <Check size={15} />
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <WorkspaceUrlModal
        isOpen={isUrlModalOpen}
        draftSlug={draftSlug}
        isSaving={isSaving}
        onClose={() => setIsUrlModalOpen(false)}
        onChange={(value) => setDraftSlug(sanitizeSlug(value))}
        onConfirm={handleUpdateSlug}
      />

      <DeleteWorkspaceModal
        isOpen={isDeleteModalOpen}
        isLoading={isDeletingWorkspace}
        workspaceName={form.name || "this workspace"}
        workspaceSlug={data.slug}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteWorkspace}
      />
    </>
  );
}

function WorkspaceUrlModal({
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
            className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl"
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

function DeleteWorkspaceModal({
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
              border border-[var(--border)]
              bg-[var(--card)]
              p-6
              shadow-2xl
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 mt-12 px-4 text-sm font-semibold">{children}</h2>;
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[1fr_256px] items-center gap-5 border-b border-[var(--border)] px-4 py-4 last:border-b-0">
      <div className="min-w-0">
        <div className="text-sm font-semibold">{label}</div>
        {description && (
          <div className={`mt-1 text-sm ${classNames.text.secondary}`}>
            {description}
          </div>
        )}
      </div>

      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Input({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="
        w-full rounded-lg border border-[var(--border)] bg-transparent
        px-3 py-2 text-sm font-semibold outline-none
        focus:border-[var(--primary)]
      "
    />
  );
}
