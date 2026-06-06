"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Plus } from "lucide-react";
import { DateTime } from "luxon";

import useProjectDocuments from "@/features/documents/hooks/useProjectDocuments";
import DataTable from "@/shared/ui/Table";
import useGetProjectMembers from "@/features/projects/hooks/useGetProjectMembers";
import useSlugs from "@/shared/hooks/useSlugs";
import SearchBar from "@/shared/ui/SearchBar";
import Select from "@/shared/ui/Select";

const filterControlClass =
  "h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)] " +
  "outline-none transition placeholder:text-[var(--text-secondary)] " +
  "hover:bg-[var(--secondary)] focus:border-[var(--primary)]";

const paginationButtonClass =
  "inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 " +
  "text-[var(--text-primary)] transition hover:bg-[var(--secondary)] " +
  "disabled:cursor-not-allowed disabled:opacity-40";

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

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    setPage(1);
  };

  const handleCreatorChange = (value: string) => {
    setCreatorId(value);
    setPage(1);
  };

  const handleOrderChange = (value: "latest" | "oldest") => {
    setOrderBy(value);
    setPage(1);
  };

  if (error) {
    return (
      <div className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger-text)]">
        Failed to load documents.
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-[var(--background)] p-4 text-[var(--text-primary)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Documents
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Manage project documents and notes.
          </p>
        </div>

        <Link
          href={`/${workspaceSlug}/projects/${projectSlug}/documents/new`}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[var(--btn-primary-bg)] px-3 text-sm font-medium text-[var(--btn-primary-color)] transition hover:bg-[var(--btn-primary-bg-hover)]"
        >
          <Plus size={16} />
          Create document
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 p-2">
        <div className="min-w-[260px] flex-1">
          <SearchBar
            value={searchText}
            onChange={handleSearchChange}
            placeholder="Search documents..."
          />

          {searchText.trim().length > 0 &&
            searchText.trim().length < SEARCH_MIN_LENGTH && (
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Enter at least {SEARCH_MIN_LENGTH} characters to search.
              </p>
            )}
        </div>

        <Select
          items={
            members
              ? members.map((m) => ({
                  label: m.fullName ?? m.username,
                  value: m.id,
                }))
              : []
          }
          className="w-50"
          onItemClicked={(value) => handleCreatorChange(value as string)}
          selectedValue={creatorId}
          allOptionLabel="All members"
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
          className="w-38"
          onItemClicked={(value) =>
            handleOrderChange(value as "latest" | "oldest")
          }
          selectedValue={orderBy}
        />
      </div>

      <DataTable
        data={documents}
        isLoading={isLoading}
        emptyText="No documents found"
        getRowKey={(row) => row.id}
        columns={[
          {
            field: "title",
            label: "Document",
            render: (row) => (
              <Link
                href={`/${workspaceSlug}/projects/${projectSlug}/documents/${row.slug}`}
                className="flex items-center gap-3"
              >
                <div className="flex size-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-secondary)]">
                  <FileText size={18} />
                </div>

                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--text-primary)]">
                    {row.title}
                  </p>
                  <p className="truncate text-xs text-[var(--text-secondary)]">
                    /documents/{row.slug}
                  </p>
                </div>
              </Link>
            ),
          },
          {
            field: "creator",
            label: "Creator",
            render: (row) => (
              <div className="flex items-center gap-2">
                {row.creator.avatarURL ? (
                  <img
                    src={row.creator.avatarURL}
                    alt={row.creator.fullName ?? row.creator.username}
                    className="size-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-7 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-semibold text-[var(--on-primary)]">
                    {(row.creator.fullName ?? row.creator.username)
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {row.creator.fullName ?? row.creator.username}
                  </p>
                  <p className="truncate text-xs text-[var(--text-secondary)]">
                    {row.creator.email}
                  </p>
                </div>
              </div>
            ),
          },
          {
            field: "createdAt",
            label: "Created",
            render: (row) => (
              <span className="text-sm text-[var(--text-secondary)]">
                {DateTime.fromISO(row.createdAt).toFormat("dd LLL yyyy")}
              </span>
            ),
          },
          {
            field: "updatedAt",
            label: "Updated",
            render: (row) => (
              <span className="text-sm text-[var(--text-secondary)]">
                {row.updatedAt
                  ? DateTime.fromISO(row.updatedAt).toRelative()
                  : "-"}
              </span>
            ),
          },
        ]}
      />

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
          <p className="text-[var(--text-secondary)]">
            Page {pagination.page} of {pagination.totalPages} ·{" "}
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
  );
}
