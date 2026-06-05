"use client";

import { ProjectMember } from "@/features/projects/types";
import { taskStatusConfig } from "@/shared/styles/classNames";
import { TaskPriority, TaskStatus } from "@/shared/types/enums";
import SearchBar from "@/shared/ui/SearchBar";
import { Check, UserRound } from "lucide-react";
import { useMemo, useState } from "react";

export const UNASSIGNED_MEMBER_ID = "__unassigned__";

const FILTER_FIELDS = ["Assignee", "Status", "Priority", "Reporter"] as const;

type FilterField = (typeof FILTER_FIELDS)[number];

type Props = {
  selectedStatuses?: TaskStatus[];
  onStatusClicked?: (clickedStatus: TaskStatus) => void;

  selectedPriorities?: TaskPriority[];
  onPriorityClicked?: (clickedPriority: TaskPriority) => void;

  members?: ProjectMember[];

  selectedAssigneeIds?: string[];
  onAssigneeClicked?: (memberId: string) => void;

  selectedReporterIds?: string[];
  onReporterClicked?: (memberId: string) => void;
};

const fieldDescriptions: Record<FilterField, string> = {
  Assignee: "Filter tasks by who owns them.",
  Status: "Filter by current task progress.",
  Priority: "Filter by task urgency.",
  Reporter: "Filter by task creator.",
};

function Checkbox({ checked }: { checked?: boolean }) {
  return (
    <span
      className={`
        flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border
        transition-all
        ${
          checked
            ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--on-primary)]"
            : "border-[var(--border)] bg-[var(--surface)]"
        }
      `}
    >
      {checked && <Check className="h-3 w-3" />}
    </span>
  );
}

export default function BoardFilters({
  selectedStatuses = [],
  onStatusClicked,
  selectedPriorities = [],
  onPriorityClicked,
  selectedAssigneeIds = [],
  onAssigneeClicked,
  onReporterClicked,
  selectedReporterIds = [],
  members = [],
}: Props) {
  const [selectedField, setSelectedField] = useState<FilterField>("Assignee");
  const [memberSearch, setMemberSearch] = useState("");

  const filteredMembers = useMemo(() => {
    const keyword = memberSearch.trim().toLowerCase();

    if (!keyword) return members;

    return members.filter((member) => {
      const name = member.fullName || member.username || member.email;

      return (
        name.toLowerCase().includes(keyword) ||
        member.email.toLowerCase().includes(keyword)
      );
    });
  }, [members, memberSearch]);

  const selectedCount = {
    Status: selectedStatuses.length,
    Priority: selectedPriorities.length,
    Assignee: selectedAssigneeIds.length,
    Reporter: selectedReporterIds.length,
  }[selectedField];

  const totalCount = {
    Status: Object.values(TaskStatus).length,
    Priority: Object.values(TaskPriority).length,
    Assignee: members.length + 1,
    Reporter: members.length,
  }[selectedField];

  const renderStatusFilter = () => {
    return (
      <div className="space-y-1">
        {Object.values(TaskStatus).map((status) => {
          const isSelected = selectedStatuses.includes(status);
          const config = taskStatusConfig[status];

          return (
            <button
              key={status}
              type="button"
              onClick={() => onStatusClicked?.(status)}
              className="
                flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left
                transition-all hover:bg-[var(--secondary)]
              "
            >
              <Checkbox checked={isSelected} />

              <span
                style={{
                  background: config.bg,
                  color: config.text,
                  opacity: isSelected ? 1 : 0.55,
                }}
                className="rounded-md px-2 py-1 text-xs font-semibold"
              >
                {config.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderPriorityFilter = () => {
    return (
      <div className="space-y-1">
        {Object.values(TaskPriority).map((priority) => {
          const isSelected = selectedPriorities.includes(priority);

          return (
            <button
              key={priority}
              type="button"
              onClick={() => onPriorityClicked?.(priority)}
              className="
                flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left
                transition-all hover:bg-[var(--secondary)]
              "
            >
              <Checkbox checked={isSelected} />

              <span
                className={`text-sm ${
                  isSelected
                    ? "font-medium text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                {priority.replace("_", " ")}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderMemberAvatar = (member: ProjectMember) => {
    const name = member.fullName || member.username || member.email;
    const initial = name.slice(0, 1).toUpperCase();

    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--primary)] text-xs font-semibold text-[var(--on-primary)]">
        {member.avatarURL ? (
          <img
            src={member.avatarURL}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          initial
        )}
      </div>
    );
  };

  const renderMemberFilter = (
    selectedIds: string[],
    type: "reporter" | "assignee",
    onClicked?: (memberId: string) => void
  ) => {
    const showUnassigned = type === "assignee";

    return (
      <div className="space-y-3">
        <SearchBar
          value={memberSearch}
          onChange={setMemberSearch}
          placeholder={`Search ${type}...`}
        />

        <div className="space-y-1">
          {showUnassigned && (
            <button
              type="button"
              onClick={() => onClicked?.(UNASSIGNED_MEMBER_ID)}
              className="
                flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left
                transition-all hover:bg-[var(--secondary)]
              "
            >
              <Checkbox checked={selectedIds.includes(UNASSIGNED_MEMBER_ID)} />

              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--text-secondary)]">
                <UserRound className="h-4 w-4" />
              </div>

              <span className="text-sm text-[var(--text-primary)]">
                Unassigned
              </span>
            </button>
          )}

          {filteredMembers.map((member) => {
            const isSelected = selectedIds.includes(member.id);
            const name = member.fullName || member.username || member.email;

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => onClicked?.(member.id)}
                className="
                  flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left
                  transition-all hover:bg-[var(--secondary)]
                "
              >
                <Checkbox checked={isSelected} />

                {renderMemberAvatar(member)}

                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm ${
                      isSelected
                        ? "font-medium text-[var(--text-primary)]"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    {name}
                  </p>

                  <p className="truncate text-xs text-[var(--text-muted)]">
                    {member.email}
                  </p>
                </div>
              </button>
            );
          })}

          {filteredMembers.length === 0 && (
            <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                No members found.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderActiveFilter = () => {
    if (selectedField === "Assignee") {
      return renderMemberFilter(
        selectedAssigneeIds,
        "assignee",
        onAssigneeClicked
      );
    }

    if (selectedField === "Reporter") {
      return renderMemberFilter(
        selectedReporterIds,
        "reporter",
        onReporterClicked
      );
    }

    if (selectedField === "Priority") return renderPriorityFilter();

    return renderStatusFilter();
  };

  return (
    <div
      className="
        flex w-[640px] max-w-[calc(100vw-32px)] flex-col overflow-hidden
        rounded-2xl border border-[var(--border)]
        bg-[var(--surface)] shadow-2xl shadow-black/20
      "
    >
      <div className="border-b border-[var(--border)] px-5 py-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          Filters
        </h2>

        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Narrow down tasks by assignee, status, priority, or reporter.
        </p>
      </div>

      <div className="grid min-h-[360px] grid-cols-[220px_1fr]">
        <aside className="border-r border-[var(--border)] bg-[var(--surface-secondary)] p-3">
          <div className="space-y-1">
            {FILTER_FIELDS.map((field) => {
              const isSelected = selectedField === field;

              return (
                <button
                  key={field}
                  type="button"
                  onClick={() => {
                    setSelectedField(field);
                    setMemberSearch("");
                  }}
                  className={`
                    group flex w-full items-center justify-between rounded-xl px-3 py-2.5
                    text-left transition-all
                    ${
                      isSelected
                        ? "bg-[var(--primary)]/15 text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
                    }
                  `}
                >
                  <span className="text-sm font-medium">{field}</span>

                  <span
                    className={`
                      rounded-full px-2 py-0.5 text-xs
                      ${
                        isSelected
                          ? "bg-[var(--primary)] text-[var(--on-primary)]"
                          : "bg-[var(--surface)] text-[var(--text-muted)]"
                      }
                    `}
                  >
                    {
                      {
                        Status: selectedStatuses.length,
                        Priority: selectedPriorities.length,
                        Assignee: selectedAssigneeIds.length,
                        Reporter: selectedReporterIds.length,
                      }[field]
                    }
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {selectedField}
            </h3>

            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {fieldDescriptions[selectedField]}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {renderActiveFilter()}
          </div>
        </section>
      </div>

      <div className="flex h-14 items-center justify-between border-t border-[var(--border)] bg-[var(--surface)] px-5">
        <p className="text-xs text-[var(--text-muted)]">
          {selectedCount} selected
        </p>

        <p className="text-sm font-semibold text-[var(--text-secondary)]">
          {selectedCount} of {totalCount}
        </p>
      </div>
    </div>
  );
}
