"use client";

import { TaskLabel } from "@/features/tasks/types";
import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Plus, Search, Tag, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { apiClient } from "../api/apiClient";
import useSlugs from "../hooks/useSlugs";

type Props = {
  labels: TaskLabel[];
  selectedLabels: TaskLabel[];
  onSelect: (label: TaskLabel) => void;
  onRemove?: (label: TaskLabel) => void;
};

function normalizeLabelName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function LabelDot({ color }: { color?: string | null }) {
  return (
    <span
      className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/10"
      style={{ backgroundColor: color || "var(--primary)" }}
    />
  );
}

export default function LabelsSelector({
  labels,
  selectedLabels,
  onSelect,
  onRemove,
}: Props) {
  const slugs = useSlugs();
  const queryClient = useQueryClient();
  const isComposingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const selectedIds = useMemo(
    () => new Set(selectedLabels.map((label) => label.id)),
    [selectedLabels]
  );

  const trimmedSearch = normalizeLabelName(searchValue);
  const normalizedSearch = trimmedSearch.toLowerCase();

  const availableLabels = useMemo(() => {
    return labels.filter((label) => !selectedIds.has(label.id));
  }, [labels, selectedIds]);

  const filteredLabels = useMemo(() => {
    if (!normalizedSearch) return availableLabels;

    return availableLabels.filter((label) =>
      label.name.toLowerCase().includes(normalizedSearch)
    );
  }, [availableLabels, normalizedSearch]);

  const existingLabel = useMemo(() => {
    if (!normalizedSearch) return null;

    return labels.find(
      (label) => label.name.trim().toLowerCase() === normalizedSearch
    );
  }, [labels, normalizedSearch]);

  const canCreateLabel = normalizedSearch.length > 0 && !existingLabel;
  const showDropdown = isOpen && (normalizedSearch.length > 0 || labels.length > 0);

  const { mutateAsync: createLabel, isPending: isCreatingLabel } = useMutation({
    mutationFn: async (name: string) => {
      const resp = await apiClient.post(
        `/workspaces/${slugs.workspace.slug}/projects/${slugs.project.slug}/labels`,
        { name }
      );

      return resp.data as TaskLabel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "get-task-labels",
          slugs.workspace.slug,
          slugs.project.slug,
        ],
      });
    },
  });

  const focusInput = () => {
    inputRef.current?.focus();
    setIsOpen(true);
  };

  const selectLabel = (label: TaskLabel) => {
    if (!selectedIds.has(label.id)) {
      onSelect(label);
    }

    setSearchValue("");
    focusInput();
  };

  const createAndSelectLabel = async () => {
    if (!canCreateLabel || isCreatingLabel) return;

    const nextLabel = await createLabel(trimmedSearch);
    onSelect(nextLabel);
    setSearchValue("");
    focusInput();
  };

  const handleEnter = async () => {
    if (filteredLabels.length > 0) {
      selectLabel(filteredLabels[0]);
      return;
    }

    await createAndSelectLabel();
  };

  return (
    <div className="relative w-full">
      <div
        role="button"
        tabIndex={-1}
        onMouseDown={(event) => {
          event.preventDefault();
          focusInput();
        }}
        className="
          flex min-h-11 w-full flex-wrap items-center gap-2 rounded-xl
          border border-[var(--border)] bg-[var(--surface)] px-3 py-2
          text-sm shadow-xs transition
          focus-within:border-[var(--primary)] focus-within:ring-2
          focus-within:ring-[var(--primary)]/15
        "
      >
        {selectedLabels.map((label) => (
          <span
            key={label.id}
            className="
              inline-flex max-w-full items-center gap-1.5 rounded-lg
              border border-[var(--border)] bg-[var(--secondary)]
              px-2 py-1 text-xs font-medium text-[var(--text-primary)]
            "
          >
            <LabelDot color={label.color} />
            <span className="max-w-[180px] truncate">{label.name}</span>
            {onRemove && (
              <button
                type="button"
                aria-label={`Remove ${label.name}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={() => onRemove(label)}
                className="
                  -mr-1 flex h-5 w-5 items-center justify-center rounded-md
                  text-[var(--text-secondary)] transition hover:bg-[var(--surface)]
                  hover:text-[var(--text-primary)]
                "
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </span>
        ))}

        <div className="flex min-w-[160px] flex-1 items-center gap-2">
          <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            value={searchValue}
            placeholder={
              selectedLabels.length > 0 ? "Add label..." : "Add labels..."
            }
            onFocus={() => setIsOpen(true)}
            onBlur={() => setIsOpen(false)}
            onChange={(event) => {
              setSearchValue(event.target.value);
              setIsOpen(true);
            }}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false;
            }}
            onKeyDown={async (event) => {
              if (event.key === "Escape") {
                setSearchValue("");
                setIsOpen(false);
                return;
              }

              if (event.key !== "Enter") return;
              if (isComposingRef.current || event.nativeEvent.isComposing) {
                return;
              }

              event.preventDefault();
              await handleEnter();
            }}
            className="
              h-7 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm
              text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]
            "
          />
        </div>
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="
              absolute left-0 z-50 mt-2 max-h-72 w-[min(360px,100%)]
              overflow-y-auto rounded-xl border border-[var(--border)]
              bg-[var(--surface)] p-1.5 shadow-2xl shadow-black/20
            "
          >
            {filteredLabels.map((label) => (
              <button
                key={label.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectLabel(label)}
                className="
                  flex w-full items-center gap-3 rounded-lg px-3 py-2
                  text-left transition hover:bg-[var(--secondary)]
                "
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)]">
                  <LabelDot color={label.color} />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--text-primary)]">
                  {label.name}
                </span>
                <Check className="h-4 w-4 text-transparent" />
              </button>
            ))}

            {canCreateLabel && (
              <button
                type="button"
                disabled={isCreatingLabel}
                onMouseDown={(event) => event.preventDefault()}
                onClick={createAndSelectLabel}
                className="
                  flex w-full items-center gap-3 rounded-lg px-3 py-2
                  text-left transition hover:bg-[var(--secondary)]
                  disabled:cursor-not-allowed disabled:opacity-60
                "
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--text-secondary)]">
                  {isCreatingLabel ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1 text-sm text-[var(--text-primary)]">
                  Create{" "}
                  <span className="font-semibold">&quot;{trimmedSearch}&quot;</span>
                </span>
              </button>
            )}

            {filteredLabels.length === 0 && !canCreateLabel && (
              <div className="px-3 py-6 text-center">
                <Tag className="mx-auto h-5 w-5 text-[var(--text-muted)]" />
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {labels.length === selectedLabels.length
                    ? "All labels are selected."
                    : "No labels found."}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
