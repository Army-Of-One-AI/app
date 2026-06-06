/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import slugify from "slugify";
import useWorkspaceDetailsBySlug from "@/features/workspaces/hooks/useWorkspaceDetailsBySlug";
import { deleteWorkspace } from "@/features/workspaces/api/deleteWorkspace";
import useSlugs from "@/shared/hooks/useSlugs";
import { classNames } from "@/shared/styles/classNames";
import { Camera, Check, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import DeleteWorkspaceModal from "./components/DeleteWorkspaceModal";
import WorkspaceUrlModal from "./components/WorkspaceURLModal";
import SettingRow from "./components/SettingRow";
import useUpdateWorkspaceSettings from "@/features/workspaces/hooks/useUpdateWorkspaceSettings";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const { data, isLoading, error, refetch } = useWorkspaceDetailsBySlug(
    slugs.workspace.slug
  );

  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [draftSlug, setDraftSlug] = useState("");
  const [logoPreviewURL, setLogoPreviewURL] = useState("");

  const { mutateAsync: update, isPending: isSaving } =
    useUpdateWorkspaceSettings();

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
    const payload = {
      ...(form.logoFile && { logoURL: form.logoURL }),
      name: form.name,
      slug: form.slug,
    };

    await update({
      workspaceSlug: slugs.workspace.slug,
      payload,
    });

    refetch();
  };

  const handleUpdateSlug = async () => {
    await update({
      workspaceSlug: slugs.workspace.slug,
      payload: { slug: draftSlug, name: form.name },
    });

    setForm((curr) => ({ ...curr, slug: draftSlug }));
    setIsUrlModalOpen(false);

    window.location.href = `${APP_URL}/${draftSlug}/settings/workspace`;
  };

  const handleDeleteWorkspace = async () => {
    try {
      setIsDeletingWorkspace(true);

      await deleteWorkspace(slugs.workspace.slug);

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
        onChange={(value) =>
          setDraftSlug(slugify(value, { lower: true, strict: true }))
        }
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 mt-12 px-4 text-sm font-semibold">{children}</h2>;
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
