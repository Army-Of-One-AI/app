"use client";

import Link from "next/link";
import type { ElementType } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, Clock, FileText, UserRound } from "lucide-react";
import { DateTime } from "luxon";

import useProjectDocument from "@/features/documents/hooks/useProjectDocument";
import useSlugs from "@/shared/hooks/useSlugs";

const skeletonClass = "animate-pulse rounded-md bg-[var(--border)]";

export default function DocumentDetailsPage() {
  const params = useParams<{ documentSlug: string }>();
  const documentSlug = params.documentSlug;
  const { workspace, project } = useSlugs();
  const workspaceSlug = workspace.slug;
  const projectSlug = project.slug;

  const { data: document, isLoading, error } = useProjectDocument(
    projectSlug,
    workspaceSlug,
    documentSlug
  );

  const documentsHref = `/${workspaceSlug}/projects/${projectSlug}/documents`;

  if (isLoading) {
    return <DocumentReaderSkeleton />;
  }

  if (error || !document) {
    return (
      <div className="min-h-full bg-[var(--background)] px-6 py-6 text-[var(--text-primary)]">
        <div className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-5 py-4 text-sm text-[var(--danger-text)]">
          Document could not be loaded.
        </div>
      </div>
    );
  }

  const creatorName = document.creator.fullName ?? document.creator.username;
  const contentHtml = document.content?.html?.trim();
  const plainText = document.content?.plainText?.trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;

  return (
    <div className="min-h-full bg-[var(--background)] px-6 py-6 text-[var(--text-primary)]">
      <div className="mx-auto max-w-5xl space-y-5">
        <Link
          href={documentsHref}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]"
        >
          <ChevronLeft size={18} />
          Documents
        </Link>

        <header className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                <FileText size={14} />
                Document
              </div>
              <h1 className="break-words text-3xl font-semibold leading-tight text-[var(--text-primary)]">
                {document.title}
              </h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                /documents/{document.slug}
              </p>
            </div>

            <div className="grid gap-2 text-sm sm:grid-cols-3 lg:min-w-[420px]">
              <MetaTile
                icon={UserRound}
                label="Creator"
                value={creatorName}
                helper={document.creator.email}
              />
              <MetaTile
                icon={Clock}
                label="Created"
                value={formatDate(document.createdAt)}
                helper={formatRelative(document.createdAt)}
              />
              <MetaTile
                icon={FileText}
                label="Length"
                value={`${wordCount}`}
                helper={wordCount === 1 ? "word" : "words"}
              />
            </div>
          </div>
        </header>

        <main className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
          <div className="border-b border-[var(--border)] px-5 py-3 text-xs text-[var(--text-secondary)]">
            Last updated {formatRelative(document.updatedAt ?? document.createdAt)}
          </div>

          <article className="min-h-[520px] px-5 py-6 sm:px-8 sm:py-8">
            {contentHtml ? (
              <div
                className="document-reader max-w-none text-[var(--text-primary)]"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] px-5 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--text-secondary)]">
                  <FileText size={22} />
                </div>
                <h2 className="mt-4 text-base font-semibold text-[var(--text-primary)]">
                  This document is empty
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
                  Add content when editing is available, or create a new document
                  with the project details you want to capture.
                </p>
              </div>
            )}
          </article>
        </main>
      </div>
    </div>
  );
}

function MetaTile({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: ElementType;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
        <Icon size={14} />
        {label}
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-[var(--text-primary)]">
        {value}
      </p>
      <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
        {helper}
      </p>
    </div>
  );
}

function DocumentReaderSkeleton() {
  return (
    <div className="min-h-full bg-[var(--background)] px-6 py-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className={`${skeletonClass} h-9 w-28`} />
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
          <div className={`${skeletonClass} h-3 w-28`} />
          <div className={`${skeletonClass} mt-5 h-9 w-2/3`} />
          <div className={`${skeletonClass} mt-3 h-4 w-56`} />
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3"
              >
                <div className={`${skeletonClass} h-3 w-20`} />
                <div className={`${skeletonClass} mt-3 h-4 w-24`} />
                <div className={`${skeletonClass} mt-2 h-3 w-28`} />
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow-soft)]">
          <div className={`${skeletonClass} h-5 w-3/4`} />
          <div className={`${skeletonClass} mt-5 h-4 w-full`} />
          <div className={`${skeletonClass} mt-3 h-4 w-11/12`} />
          <div className={`${skeletonClass} mt-3 h-4 w-10/12`} />
          <div className={`${skeletonClass} mt-8 h-5 w-1/2`} />
          <div className={`${skeletonClass} mt-5 h-4 w-full`} />
          <div className={`${skeletonClass} mt-3 h-4 w-8/12`} />
        </section>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return DateTime.fromISO(value).toFormat("dd LLL yyyy");
}

function formatRelative(value: string) {
  return DateTime.fromISO(value).toRelative() ?? "recently";
}
