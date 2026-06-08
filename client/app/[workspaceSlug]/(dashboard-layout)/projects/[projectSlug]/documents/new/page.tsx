"use client";

import { createDocument } from "@/features/documents/api/createDocument";
import useSlugs from "@/shared/hooks/useSlugs";
import RichTextEditor from "@/shared/ui/RichTextEditor";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Clock,
  FileText,
  Info,
  Save,
  Type,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ElementType, KeyboardEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { toast, ToastContainer } from "react-toastify";

const panelClass =
  "rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]";

export default function NewDocument() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { workspace, project } = useSlugs();
  const workspaceSlug = workspace.slug;
  const projectSlug = project.slug;
  const documentsHref = `/${workspaceSlug}/projects/${projectSlug}/documents`;

  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [content, setContent] = useState({
    html: "",
    plainText: "",
  });

  const titleValue = title.trim();
  const bodyText = content.plainText.trim();
  const hasBody = bodyText.length > 0;
  const isDirty = titleValue.length > 0 || hasBody;
  const canCreate = titleValue.length > 0;
  const showTitleError = titleTouched && !canCreate;

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      return await createDocument({
        workspaceSlug,
        projectSlug,
        content: {
          html: content.html,
          plainText: content.plainText,
        },
        title: titleValue,
      });
    },
  });

  const wordCount = useMemo(() => {
    return bodyText ? bodyText.split(/\s+/).length : 0;
  }, [bodyText]);

  const readingTime = Math.max(1, Math.ceil(wordCount / 220));

  useEffect(() => {
    if (!isDirty || isPending) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isPending]);

  const handleCreate = () => {
    setTitleTouched(true);

    if (!canCreate || isPending) {
      return;
    }

    mutate(undefined, {
      onSuccess: async (document) => {
        await queryClient.invalidateQueries({
          queryKey: ["find-project-documents", workspaceSlug, projectSlug],
        });

        await queryClient.invalidateQueries({
          queryKey: [
            "get-project-document",
            workspaceSlug,
            projectSlug,
            document.slug,
          ],
        });

        toast("Document created", {
          type: "success",
          containerId: "new-document",
        });

        router.push(
          `/${workspaceSlug}/projects/${projectSlug}/documents/${document.slug}`
        );
      },
      onError: () => {
        toast("Could not create document. Try again.", {
          type: "error",
          containerId: "new-document",
        });
      },
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      handleCreate();
    }
  };

  return (
    <div
      className="flex min-h-full flex-col bg-[var(--background)] text-[var(--text-primary)]"
      onKeyDown={handleKeyDown}
    >
      <div className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
        <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={documentsHref}
              className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl px-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]"
            >
              <ChevronLeft size={18} />
              Documents
            </Link>

            <div className="hidden h-5 w-px bg-[var(--border)] sm:block" />

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                New document
              </p>
              <p className="truncate text-xs text-[var(--text-secondary)]">
                {isDirty ? "Unsaved draft" : "Start with a title"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={documentsHref}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--secondary)]"
            >
              Cancel
            </Link>

            <button
              disabled={!canCreate || isPending}
              type="button"
              onClick={handleCreate}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[var(--btn-primary-bg)] px-3 text-sm font-medium text-[var(--btn-primary-color)] shadow-xs transition hover:bg-[var(--btn-primary-bg-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} />
              {isPending ? "Creating..." : "Create document"}
            </button>
          </div>
        </div>
      </div>

      <main className="grid w-full flex-1 gap-5 px-4 py-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className={`${panelClass} min-w-0 overflow-hidden`}>
          <div className="border-b border-[var(--border)] px-5 py-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--secondary)] px-2.5 py-1 font-medium">
                <FileText size={13} />
                Project document
              </span>
              <span>
                {wordCount} {wordCount === 1 ? "word" : "words"}
              </span>
              <span className="hidden sm:inline">-</span>
              <span>{readingTime} min read</span>
            </div>
          </div>

          <div className="px-5 py-5">
            <label
              htmlFor="document-title"
              className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]"
            >
              <Type size={14} />
              Title
            </label>

            <input
              id="document-title"
              autoFocus
              value={title}
              onBlur={() => setTitleTouched(true)}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Give this document a clear name"
              aria-invalid={showTitleError}
              className={`w-full rounded-xl border bg-[var(--background)] px-4 py-3 text-2xl font-semibold text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] sm:text-3xl ${
                showTitleError
                  ? "border-[var(--danger-border)]"
                  : "border-[var(--border)] focus:border-[var(--primary)]"
              }`}
            />

            {showTitleError ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--danger-text)]">
                <AlertCircle size={14} />
                Add a title before creating this document.
              </p>
            ) : (
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                Use a specific title like API handoff notes or Release scope.
              </p>
            )}
          </div>

          <div className="px-5 pb-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                Content
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Ctrl/Cmd + Enter to create
              </p>
            </div>

            <div className="min-h-[560px] text-[var(--text-primary)]">
              <RichTextEditor
                className="min-h-[560px]"
                onChange={(value) => setContent(value)}
                value={content}
              />
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className={panelClass}>
            <div className="border-b border-[var(--border)] px-4 py-3">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Document status
              </h2>
            </div>
            <div className="space-y-3 p-4">
              <StatusRow
                active={canCreate}
                icon={CheckCircle2}
                label="Title ready"
                value={canCreate ? "Ready" : "Required"}
              />
              <StatusRow
                active={hasBody}
                icon={FileText}
                label="Body content"
                value={hasBody ? `${wordCount} words` : "Optional"}
              />
              <StatusRow
                active={isDirty}
                icon={Clock}
                label="Draft state"
                value={isDirty ? "Unsaved changes" : "Empty"}
              />
            </div>
          </section>

          <section className={panelClass}>
            <div className="border-b border-[var(--border)] px-4 py-3">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Writing checklist
              </h2>
            </div>
            <div className="space-y-3 p-4 text-sm text-[var(--text-secondary)]">
              <ChecklistItem label="State the decision, spec, or note clearly." />
              <ChecklistItem label="Add owner names, dates, links, or context." />
              <ChecklistItem label="Use headings and lists so readers can scan it." />
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-4 text-sm text-[var(--text-secondary)]">
            <div className="mb-2 flex items-center gap-2 font-medium text-[var(--text-primary)]">
              <Info size={16} />
              After create
            </div>
            <p className="leading-6">
              The document opens in the reader view immediately, and the
              project document library refreshes in the background.
            </p>
          </section>
        </aside>
      </main>

      <ToastContainer containerId="new-document" newestOnTop />
    </div>
  );
}

function StatusRow({
  active,
  icon: Icon,
  label,
  value,
}: {
  active: boolean;
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
          active
            ? "bg-[var(--success)] text-[var(--text-primary)]"
            : "bg-[var(--secondary)] text-[var(--text-secondary)]"
        }`}
      >
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
          {label}
        </p>
        <p className="truncate text-xs text-[var(--text-secondary)]">
          {value}
        </p>
      </div>
    </div>
  );
}

function ChecklistItem({ label }: { label: string }) {
  return (
    <div className="flex gap-2">
      <CheckCircle2
        size={16}
        className="mt-0.5 shrink-0 text-[var(--text-secondary)]"
      />
      <span className="leading-6">{label}</span>
    </div>
  );
}
