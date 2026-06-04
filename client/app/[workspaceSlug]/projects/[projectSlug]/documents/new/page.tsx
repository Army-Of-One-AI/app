"use client";

import { createDocument } from "@/features/documents/api/createDocument";
import RichTextEditor from "@/shared/ui/RichTextEditor";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, FileText, Save } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast, ToastContainer } from "react-toastify";

export default function NewDocument() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const projectSlug = params.projectSlug as string;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState({
    html: "",
    plainText: "",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      return await createDocument({
        workspaceSlug,
        projectSlug,
        content,
        title,
      });
    },
  });

  const wordCount = useMemo(() => {
    const text = content.plainText.trim();
    return text ? text.split(/\s+/).length : 0;
  }, [content.plainText]);

  const canCreate =
    title.trim().length > 0 || content.plainText.trim().length > 0;

  return (
    <div className="flex min-h-full flex-col bg-[var(--background)]">
      <div className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur">
        <div className="mx-auto flex items-center justify-between gap-3 px-4 py-3">
          <Link
            href={`/${workspaceSlug}/projects/${projectSlug}/documents`}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]"
          >
            <ChevronLeft size={18} />
            Documents
          </Link>

          <button
            disabled={!canCreate || isPending}
            type="button"
            onClick={() =>
              mutate(undefined, {
                onSuccess: async () => {
                  await queryClient.invalidateQueries({
                    queryKey: [
                      "find-project-documents",
                      workspaceSlug,
                      projectSlug,
                    ],
                  });

                  toast("Create document success", {
                    type: "success",
                    containerId: "new-document",
                  });

                  setTimeout(
                    () =>
                      router.push(
                        `/${workspaceSlug}/projects/${projectSlug}/documents`
                      ),
                    2500
                  );
                },
              })
            }
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--btn-primary-bg)] px-3 text-sm font-medium text-[var(--btn-primary-color)] transition hover:bg-[var(--btn-primary-bg-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={16} />
            Create document
          </button>
        </div>
      </div>

      <main className="mx-auto flex w-full flex-1 flex-col px-4 py-6">
        <div className="mb-4 flex items-center gap-3 text-[var(--text-secondary)]">
          <div className="flex size-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-secondary)]">
            <FileText size={20} />
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              New document
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </p>
          </div>
        </div>

        <section className="flex flex-1 flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)]">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled document"
            className="mb-4 py-4 w-full bg-transparent text-3xl font-semibold tracking-tight text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
          />

          <div className="min-h-[520px] flex-1 text-[var(--text-primary)]">
            <RichTextEditor
              onChange={(value) => setContent(value)}
              value={content}
            />
          </div>
        </section>
      </main>
      <ToastContainer containerId="new-document" />
    </div>
  );
}
