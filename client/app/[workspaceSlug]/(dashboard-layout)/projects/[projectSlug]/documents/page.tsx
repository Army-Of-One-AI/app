"use client";

import Link from "next/link";
import type { ElementType } from "react";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FilePlus,
  FileText,
  SearchX,
  UserRound,
  X,
} from "lucide-react";
import { DateTime } from "luxon";

import useProjectDocuments from "@/features/documents/hooks/useProjectDocuments";
import useGetProjectMembers from "@/features/projects/hooks/useGetProjectMembers";
import useSlugs from "@/shared/hooks/useSlugs";
import SearchBar from "@/shared/ui/SearchBar";
import Select from "@/shared/ui/Select";

const paginationButtonClass =
  "inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 " +
  "text-sm font-medium text-[var(--text-primary)] shadow-xs transition hover:bg-[var(--secondary)] " +
  "disabled:cursor-not-allowed disabled:opacity-40";

const skeletonClass = "animate-pulse rounded-md bg-[var(--border)]";

const LIMIT = 8;
const SEARCH_MIN_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 500;

export default function DocumentsPage() {
  const { workspace, project } = useSlugs();
  const workspaceSlug = workspace.slug;
  const projectSlug = project.slug;

  const { data: members } = useGetProjectMembers(projectSlug, workspaceSlug);

  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [creatorId, setCreatorId] = useState("");
  const [orderBy, setOrderBy] = useState<"latest" | "oldest">("latest");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchText(searchText.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [searchText]);

  const titleFilter =
    debouncedSearchText.length >= SEARCH_MIN_LENGTH
      ? debouncedSearchText
      : undefined;

  const {
    data: getDocumentsResponse,
    isLoading,
    error,
  } = useProjectDocuments(projectSlug, workspaceSlug, {
    page,
    limit: LIMIT,
    title: titleFilter,
    creatorId: creatorId || undefined,
    orderBy,
  });

  const documents = getDocumentsResponse?.items ?? [];
  const pagination = getDocumentsResponse?.pagination;
  const selectedCreator = members?.find((member) => member.id === creatorId);
  const hasActiveFilters = Boolean(titleFilter || creatorId || orderBy !== "latest");

  const uniqueCreators = new Set(
    documents.map((document) => document.creator.id)
  ).size;
  const updatedThisWeek = documents.filter((document) => {
    const updatedAt = document.updatedAt ?? document.createdAt;
    return DateTime.fromISO(updatedAt) >= DateTime.now().minus({ days: 7 });
  }).length;
  const stats = [
    {
      label: "Total documents",
      value: pagination?.total ?? documents.length,
      helper: "Matching this view",
      icon: FileText,
    },
    {
      label: "Visible now",
      value: documents.length,
      helper: `${LIMIT} per page`,
      icon: ArrowUpDown,
    },
    {
      label: "Updated recently",
      value: updatedThisWeek,
      helper: "Last 7 days on this page",
      icon: Clock,
    },
    {
      label: "Contributors",
      value: uniqueCreators,
      helper: "On this page",
      icon: UserRound,
    },
  ];

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    setPage(1);
  };

  const handleCreatorChange = (value: string | number | undefined) => {
    setCreatorId(value ? String(value) : "");
    setPage(1);
  };

  const handleOrderChange = (value: string | number | undefined) => {
    setOrderBy(value === "oldest" ? "oldest" : "latest");
    setPage(1);
  };

  const resetFilters = () => {
    setSearchText("");
    setDebouncedSearchText("");
    setCreatorId("");
    setOrderBy("latest");
    setPage(1);
  };

  if (error) {
    return (
      <div className="min-h-full bg-[var(--background)] px-6 py-6">
        <div className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-5 py-4 text-sm text-[var(--danger-text)]">
          Failed to load documents. Refresh the page or try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[var(--background)] px-6 py-6 text-[var(--text-primary)]">
      <div className="space-y-5">
        <header className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                <FileText size={14} />
                Project documents
              </div>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                Documents
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                Keep project notes, specs, decisions, and planning references in
                one searchable workspace.
              </p>
            </div>

            <Link
              href={`/${workspaceSlug}/projects/${projectSlug}/documents/new`}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--btn-primary-bg)] px-4 text-sm font-medium text-[var(--btn-primary-color)] shadow-xs transition hover:bg-[var(--btn-primary-bg-hover)]"
            >
              <FilePlus size={16} />
              Create document
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        </header>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)]">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start">
            <div className="min-w-[240px] flex-1">
              <SearchBar
                value={searchText}
                onChange={handleSearchChange}
                placeholder="Search documents..."
              />

              {searchText.trim().length > 0 &&
                searchText.trim().length < SEARCH_MIN_LENGTH && (
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">
                    Enter at least {SEARCH_MIN_LENGTH} characters to search.
                  </p>
                )}
            </div>

            <Select
              items={
                members
                  ? members.map((member) => ({
                      label: member.fullName ?? member.username,
                      value: member.id,
                    }))
                  : []
              }
              className="w-full xl:w-56"
              onItemClicked={handleCreatorChange}
              selectedValue={creatorId}
              allOptionLabel="All creators"
              searchable
              showAllOption
            />

            <Select
              items={[
                {
                  value: "latest",
                  label: "Latest first",
                },
                {
                  value: "oldest",
                  label: "Oldest first",
                },
              ]}
              className="w-full xl:w-44"
              onItemClicked={handleOrderChange}
              selectedValue={orderBy}
            />
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {titleFilter && (
                <FilterChip label={`Search: ${titleFilter}`} onClear={() => handleSearchChange("")} />
              )}
              {selectedCreator && (
                <FilterChip
                  label={`Creator: ${selectedCreator.fullName ?? selectedCreator.username}`}
                  onClear={() => handleCreatorChange(undefined)}
                />
              )}
              {orderBy === "oldest" && (
                <FilterChip label="Oldest first" onClear={() => handleOrderChange("latest")} />
              )}

              <button
                type="button"
                onClick={resetFilters}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]"
              >
                Reset filters
              </button>
            </div>
          )}
        </section>

        {isLoading ? (
          <DocumentsSkeleton />
        ) : documents.length > 0 ? (
          <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
            <div className="border-b border-[var(--border)] px-4 py-3 text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
              Document library
            </div>

            <div className="divide-y divide-[var(--border)]">
              {documents.map((document) => (
                <Link
                  key={document.id}
                  href={`/${workspaceSlug}/projects/${projectSlug}/documents/${document.slug}`}
                  className="group grid gap-4 px-4 py-4 transition hover:bg-[var(--secondary)]/45 md:grid-cols-[minmax(0,1fr)_220px_160px_32px] md:items-center"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)]">
                      <FileText size={18} />
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-[var(--text-primary)]">
                        {document.title}
                      </h2>
                      <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
                        /documents/{document.slug}
                      </p>
                    </div>
                  </div>

                  <CreatorCell document={document} />

                  <div className="text-xs text-[var(--text-secondary)] md:text-right">
                    <p className="font-medium text-[var(--text-primary)]">
                      {formatDate(document.createdAt)}
                    </p>
                    <p className="mt-1">
                      Updated {formatRelative(document.updatedAt ?? document.createdAt)}
                    </p>
                  </div>

                  <div className="hidden justify-end text-[var(--text-secondary)] transition group-hover:text-[var(--text-primary)] md:flex">
                    <ArrowRight size={18} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <EmptyState
            hasActiveFilters={hasActiveFilters}
            onResetFilters={resetFilters}
            createHref={`/${workspaceSlug}/projects/${projectSlug}/documents/new`}
          />
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm shadow-[var(--shadow-soft)] sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[var(--text-secondary)]">
              Page {pagination.page} of {pagination.totalPages} -{" "}
              {pagination.total} documents
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={!pagination.hasPreviousPage || isLoading}
                onClick={() => setPage((curr) => Math.max(1, curr - 1))}
                className={paginationButtonClass}
              >
                <ChevronLeft size={16} />
                Prev
              </button>

              <button
                disabled={!pagination.hasNextPage || isLoading}
                onClick={() => setPage((curr) => curr + 1)}
                className={paginationButtonClass}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: number;
  helper: string;
  icon: ElementType;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-[var(--text-secondary)]">
          {label}
        </p>
        <Icon size={16} className="text-[var(--text-secondary)]" />
      </div>
      <p className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">
        {value}
      </p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">{helper}</p>
    </div>
  );
}

function FilterChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]"
    >
      <span className="truncate">{label}</span>
      <X size={13} />
    </button>
  );
}

function CreatorCell({
  document,
}: {
  document: {
    creator: {
      fullName: string | null;
      username: string;
      email: string;
      avatarURL: string | null;
    };
  };
}) {
  const creatorName = document.creator.fullName ?? document.creator.username;

  return (
    <div className="flex min-w-0 items-center gap-2">
      {document.creator.avatarURL ? (
        <div
          aria-label={creatorName}
          className="size-8 shrink-0 rounded-full bg-cover bg-center"
          role="img"
          style={{
            backgroundImage: `url("${document.creator.avatarURL}")`,
          }}
        />
      ) : (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)] text-xs font-semibold text-[var(--text-secondary)]">
          {getInitials(creatorName)}
        </div>
      )}

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
          {creatorName}
        </p>
        <p className="truncate text-xs text-[var(--text-secondary)]">
          {document.creator.email}
        </p>
      </div>
    </div>
  );
}

function EmptyState({
  hasActiveFilters,
  onResetFilters,
  createHref,
}: {
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  createHref: string;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-12 text-center shadow-[var(--shadow-soft)]">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--text-secondary)]">
        {hasActiveFilters ? <SearchX size={22} /> : <FileText size={22} />}
      </div>
      <h2 className="mt-4 text-base font-semibold text-[var(--text-primary)]">
        {hasActiveFilters ? "No matching documents" : "No documents yet"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
        {hasActiveFilters
          ? "Try clearing filters or broadening your search to find more project references."
          : "Create the first project document for specs, decisions, research, or planning notes."}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--secondary)]"
          >
            Reset filters
          </button>
        )}

        <Link
          href={createHref}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--btn-primary-bg)] px-4 text-sm font-medium text-[var(--btn-primary-color)] transition hover:bg-[var(--btn-primary-bg-hover)]"
        >
          <FilePlus size={16} />
          Create document
        </Link>
      </div>
    </section>
  );
}

function DocumentsSkeleton() {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <div className={`${skeletonClass} h-3 w-32`} />
      </div>
      <div className="divide-y divide-[var(--border)]">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,1fr)_220px_160px_32px] md:items-center"
          >
            <div className="flex items-start gap-3">
              <div className={`${skeletonClass} size-10 rounded-xl`} />
              <div className="min-w-0 flex-1 space-y-2">
                <div className={`${skeletonClass} h-4 w-2/3`} />
                <div className={`${skeletonClass} h-3 w-1/2`} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`${skeletonClass} size-8 rounded-full`} />
              <div className="flex-1 space-y-2">
                <div className={`${skeletonClass} h-3 w-28`} />
                <div className={`${skeletonClass} h-3 w-36`} />
              </div>
            </div>
            <div className="space-y-2 md:ml-auto md:w-32">
              <div className={`${skeletonClass} h-3 w-full`} />
              <div className={`${skeletonClass} h-3 w-24 md:ml-auto`} />
            </div>
            <div className={`${skeletonClass} hidden size-5 md:block`} />
          </div>
        ))}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  return DateTime.fromISO(value).toFormat("dd LLL yyyy");
}

function formatRelative(value: string) {
  return DateTime.fromISO(value).toRelative() ?? "recently";
}

function getInitials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return initials || "?";
}
