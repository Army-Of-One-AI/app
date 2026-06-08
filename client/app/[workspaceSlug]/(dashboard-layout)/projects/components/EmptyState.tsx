import { FolderKanban, Plus, SearchX } from "lucide-react";

export default function EmptyState({
  hasActiveFilters,
  onCreate,
  onResetFilters,
}: {
  hasActiveFilters: boolean;
  onCreate: () => void;
  onResetFilters: () => void;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-14 text-center shadow-[var(--shadow-soft)]">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--text-secondary)]">
        {hasActiveFilters ? <SearchX size={22} /> : <FolderKanban size={22} />}
      </div>
      <h2 className="mt-4 text-base font-semibold text-[var(--text-primary)]">
        {hasActiveFilters ? "No matching projects" : "No projects yet"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
        {hasActiveFilters
          ? "Clear the current filters or search for a different project name."
          : "Create your first project to start organizing tasks, documents, and delivery work."}
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

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--btn-primary-bg)] px-4 text-sm font-medium text-[var(--btn-primary-color)] transition hover:bg-[var(--btn-primary-bg-hover)]"
        >
          <Plus size={16} />
          Create project
        </button>
      </div>
    </section>
  );
}
