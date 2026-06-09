"use client";

import { ProjectMember } from "@/features/projects/types";
import { Sprint } from "@/features/sprints/types";
import { Epic } from "@/features/tasks/types";
import { taskStatusConfig } from "@/shared/styles/classNames";
import { TaskPriority, TaskStatus } from "@/shared/types/enums";
import SearchBar from "@/shared/ui/SearchBar";
import { Check, Layers3, Tag, TimerReset, UserRound } from "lucide-react";
import { useMemo, useState } from "react";

export const UNASSIGNED_MEMBER_ID = "__unassigned__";
export const UNASSIGNED_EPIC_ID = "__no_epic__";
export const UNLABELLED_LABEL_ID = "__unlabelled__";

type TaskLabel = {
  id: string;
  name: string;
  color?: string | null;
};

const FILTER_FIELDS = [
  "Assignee",
  "Sprint",
  "Epic",
  "Label",
  "Status",
  "Priority",
  "Reporter",
] as const;

type FilterField = (typeof FILTER_FIELDS)[number];

type Props = {
  selectedStatuses?: TaskStatus[];
  onStatusClicked?: (clickedStatus: TaskStatus) => void;
  onSelectAllStatuses?: () => void;
  onClearStatuses?: () => void;

  selectedPriorities?: TaskPriority[];
  onPriorityClicked?: (clickedPriority: TaskPriority) => void;
  onSelectAllPriorities?: () => void;
  onClearPriorities?: () => void;

  members?: ProjectMember[];
  epics?: Epic[];
  sprints?: Sprint[];
  labels?: TaskLabel[];

  selectedLabelIds?: string[];
  onLabelClicked?: (labelId: string) => void;
  onSelectAllLabels?: () => void;
  onClearLabels?: () => void;

  selectedEpicIds?: string[];
  onEpicClicked?: (epicId: string) => void;
  onSelectAllEpics?: () => void;
  onClearEpics?: () => void;

  selectedSprintIds?: string[];
  onSprintClicked?: (sprintId: string) => void;
  onSelectAllSprints?: () => void;
  onClearSprints?: () => void;

  selectedAssigneeIds?: string[];
  onAssigneeClicked?: (memberId: string) => void;
  onSelectAllAssignees?: () => void;
  onClearAssignees?: () => void;

  selectedReporterIds?: string[];
  onReporterClicked?: (memberId: string) => void;
  onSelectAllReporters?: () => void;
  onClearReporters?: () => void;
};

const fieldDescriptions: Record<FilterField, string> = {
  Assignee: "Filter tasks by who owns them.",
  Sprint: "Filter tasks by sprint cycle.",
  Epic: "Filter tasks by product area or initiative.",
  Label: "Filter tasks by assigned labels.",
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
  onSelectAllStatuses,
  onClearStatuses,

  selectedPriorities = [],
  onPriorityClicked,
  onSelectAllPriorities,
  onClearPriorities,

  selectedAssigneeIds = [],
  onAssigneeClicked,
  onSelectAllAssignees,
  onClearAssignees,

  selectedReporterIds = [],
  onReporterClicked,
  onSelectAllReporters,
  onClearReporters,

  selectedEpicIds = [],
  onEpicClicked,
  onSelectAllEpics,
  onClearEpics,

  selectedSprintIds = [],
  onSprintClicked,
  onSelectAllSprints,
  onClearSprints,

  selectedLabelIds = [],
  onLabelClicked,
  onSelectAllLabels,
  onClearLabels,

  members = [],
  epics = [],
  sprints = [],
  labels = [],
}: Props) {
  const [selectedField, setSelectedField] = useState<FilterField>("Assignee");
  const [memberSearch, setMemberSearch] = useState("");
  const [epicSearch, setEpicSearch] = useState("");
  const [sprintSearch, setSprintSearch] = useState("");
  const [labelSearch, setLabelSearch] = useState("");

  const filteredLabels = useMemo(() => {
    const keyword = labelSearch.trim().toLowerCase();

    if (!keyword) return labels;

    return labels.filter((label) => label.name.toLowerCase().includes(keyword));
  }, [labels, labelSearch]);

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

  const filteredEpics = useMemo(() => {
    const keyword = epicSearch.trim().toLowerCase();

    if (!keyword) return epics;

    return epics.filter((epic) => epic.title.toLowerCase().includes(keyword));
  }, [epics, epicSearch]);

  const filteredSprints = useMemo(() => {
    const keyword = sprintSearch.trim().toLowerCase();

    if (!keyword) return sprints;

    return sprints.filter((sprint) =>
      sprint.name.toLowerCase().includes(keyword)
    );
  }, [sprints, sprintSearch]);

  const selectedCount = {
    Status: selectedStatuses.length,
    Priority: selectedPriorities.length,
    Assignee: selectedAssigneeIds.length,
    Reporter: selectedReporterIds.length,
    Epic: selectedEpicIds.length,
    Sprint: selectedSprintIds.length,
    Label: selectedLabelIds.length,
  }[selectedField];

  const totalCount = {
    Status: Object.values(TaskStatus).length,
    Priority: Object.values(TaskPriority).length,
    Assignee: members.length + 1,
    Reporter: members.length,
    Epic: epics.length + 1,
    Sprint: sprints.length,
    Label: labels.length + 1,
  }[selectedField];

  const getFilterMeta = (field: FilterField) => {
    const selected = {
      Status: selectedStatuses.length,
      Priority: selectedPriorities.length,
      Assignee: selectedAssigneeIds.length,
      Reporter: selectedReporterIds.length,
      Epic: selectedEpicIds.length,
      Sprint: selectedSprintIds.length,
      Label: selectedLabelIds.length,
    }[field];

    const total = {
      Status: Object.values(TaskStatus).length,
      Priority: Object.values(TaskPriority).length,
      Assignee: members.length + 1,
      Reporter: members.length,
      Epic: epics.length + 1,
      Sprint: sprints.length,
      Label: labels.length + 1,
    }[field];

    const isActive = selected !== total;
    const label =
      total === 0 || selected === total
        ? "All"
        : selected === 0
        ? "None"
        : `${selected} selected`;

    return { selected, total, isActive, label };
  };

  const selectedFieldActions = {
    Assignee: {
      onSelectAll: onSelectAllAssignees,
      onClear: onClearAssignees,
    },
    Sprint: {
      onSelectAll: onSelectAllSprints,
      onClear: onClearSprints,
    },
    Epic: {
      onSelectAll: onSelectAllEpics,
      onClear: onClearEpics,
    },
    Label: {
      onSelectAll: onSelectAllLabels,
      onClear: onClearLabels,
    },
    Status: {
      onSelectAll: onSelectAllStatuses,
      onClear: onClearStatuses,
    },
    Priority: {
      onSelectAll: onSelectAllPriorities,
      onClear: onClearPriorities,
    },
    Reporter: {
      onSelectAll: onSelectAllReporters,
      onClear: onClearReporters,
    },
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

  const renderLabelFilter = () => {
    const hasSearch = labelSearch.trim().length > 0;

    return (
      <div className="space-y-3">
        <SearchBar
          value={labelSearch}
          onChange={setLabelSearch}
          placeholder="Search labels..."
        />

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onLabelClicked?.(UNLABELLED_LABEL_ID)}
            className="
              flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left
              transition-all hover:bg-[var(--secondary)]
            "
          >
            <Checkbox checked={selectedLabelIds.includes(UNLABELLED_LABEL_ID)} />

            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--text-secondary)]">
              <Tag className="h-4 w-4" />
            </div>

            <span className="text-sm text-[var(--text-primary)]">
              Unlabelled
            </span>
          </button>

          {filteredLabels.map((label) => {
            const isSelected = selectedLabelIds.includes(label.id);

            return (
              <button
                key={label.id}
                type="button"
                onClick={() => onLabelClicked?.(label.id)}
                className="
                  flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left
                  transition-all hover:bg-[var(--secondary)]
                "
              >
                <Checkbox checked={isSelected} />

                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--secondary)]"
                  style={{
                    color: label.color ?? "var(--text-secondary)",
                  }}
                >
                  <Tag className="h-4 w-4" />
                </div>

                <span
                  className={`min-w-0 flex-1 truncate text-sm ${
                    isSelected
                      ? "font-medium text-[var(--text-primary)]"
                      : "text-[var(--text-primary)]"
                  }`}
                >
                  {label.name}
                </span>
              </button>
            );
          })}

          {filteredLabels.length === 0 && hasSearch ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                No labels match your search.
              </p>
            </div>
          ) : labels.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                No labels in this project yet.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderSprintFilter = () => {
    const hasSearch = sprintSearch.trim().length > 0;

    return (
      <div className="space-y-3">
        <SearchBar
          value={sprintSearch}
          onChange={setSprintSearch}
          placeholder="Search sprints..."
        />

        <div className="space-y-1">
          {filteredSprints.map((sprint) => {
            const isSelected = selectedSprintIds.includes(sprint.id);

            return (
              <button
                key={sprint.id}
                type="button"
                onClick={() => onSprintClicked?.(sprint.id)}
                className="
                  flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left
                  transition-all hover:bg-[var(--secondary)]
                "
              >
                <Checkbox checked={isSelected} />

                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--text-secondary)]">
                  <TimerReset className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm ${
                      isSelected
                        ? "font-medium text-[var(--text-primary)]"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    {sprint.name}
                  </p>

                  <p className="truncate text-xs text-[var(--text-muted)]">
                    {sprint.status}
                  </p>
                </div>
              </button>
            );
          })}

          {sprints.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                No sprints in this project.
              </p>
            </div>
          ) : filteredSprints.length === 0 && hasSearch ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                No sprints match your search.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderEpicFilter = () => {
    const hasSearch = epicSearch.trim().length > 0;

    return (
      <div className="space-y-3">
        <SearchBar
          value={epicSearch}
          onChange={setEpicSearch}
          placeholder="Search epics..."
        />

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onEpicClicked?.(UNASSIGNED_EPIC_ID)}
            className="
              flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left
              transition-all hover:bg-[var(--secondary)]
            "
          >
            <Checkbox checked={selectedEpicIds.includes(UNASSIGNED_EPIC_ID)} />

            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--text-secondary)]">
              <Layers3 className="h-4 w-4" />
            </div>

            <span className="text-sm text-[var(--text-primary)]">No epic</span>
          </button>

          {filteredEpics.map((epic) => {
            const isSelected = selectedEpicIds.includes(epic.id);

            return (
              <button
                key={epic.id}
                type="button"
                onClick={() => onEpicClicked?.(epic.id)}
                className="
                  flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left
                  transition-all hover:bg-[var(--secondary)]
                "
              >
                <Checkbox checked={isSelected} />

                <span
                  className="h-7 w-7 shrink-0 rounded-full border border-[var(--border)]"
                  style={{ background: epic.color ?? "var(--primary)" }}
                />

                <span
                  className={`min-w-0 flex-1 truncate text-sm ${
                    isSelected
                      ? "font-medium text-[var(--text-primary)]"
                      : "text-[var(--text-primary)]"
                  }`}
                >
                  {epic.title}
                </span>
              </button>
            );
          })}

          {epics.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                No epics in this project.
              </p>
            </div>
          ) : filteredEpics.length === 0 && hasSearch ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                No epics match your search.
              </p>
            </div>
          ) : null}
        </div>
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
    const hasSearch = memberSearch.trim().length > 0;

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

          {members.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                No project members yet.
              </p>
            </div>
          ) : filteredMembers.length === 0 && hasSearch ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                No members match your search.
              </p>
            </div>
          ) : null}
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

    if (selectedField === "Sprint") return renderSprintFilter();

    if (selectedField === "Reporter") {
      return renderMemberFilter(
        selectedReporterIds,
        "reporter",
        onReporterClicked
      );
    }

    if (selectedField === "Priority") return renderPriorityFilter();

    if (selectedField === "Epic") return renderEpicFilter();

    if (selectedField === "Label") return renderLabelFilter();

    return renderStatusFilter();
  };

  return (
    <div
      className="
        flex w-[min(720px,calc(100vw-32px))] flex-col overflow-hidden
        rounded-2xl border border-[var(--border)]
        bg-[var(--surface)] shadow-2xl shadow-black/20
      "
    >
      <div className="border-b border-[var(--border)] px-5 py-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          Filters
        </h2>

        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Narrow down tasks by assignee, sprint, epic, label, status, priority,
          or reporter.
        </p>
      </div>

      <div className="grid min-h-[360px] grid-cols-1 sm:grid-cols-[220px_1fr]">
        <aside className="border-b border-[var(--border)] bg-[var(--surface-secondary)] p-3 sm:border-r sm:border-b-0">
          <div className="space-y-1">
            {FILTER_FIELDS.map((field) => {
              const isSelected = selectedField === field;
              const meta = getFilterMeta(field);

              return (
                <button
                  key={field}
                  type="button"
                  onClick={() => {
                    setSelectedField(field);
                    setMemberSearch("");
                    setEpicSearch("");
                    setSprintSearch("");
                    setLabelSearch("");
                  }}
                  className={`
                    group flex w-full items-center justify-between rounded-xl px-3 py-2.5
                    text-left transition-all
                    ${
                      isSelected
                        ? "bg-[var(--primary)]/15 text-[var(--text-primary)]"
                        : meta.isActive
                        ? "bg-[var(--surface)] text-[var(--text-primary)]"
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
                          : meta.isActive
                          ? "bg-[var(--secondary)] text-[var(--text-primary)]"
                          : "bg-[var(--surface)] text-[var(--text-muted)]"
                      }
                    `}
                  >
                    {meta.label}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {selectedField}
              </h3>

              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {fieldDescriptions[selectedField]}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectedFieldActions.onSelectAll}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]"
              >
                Select all
              </button>

              <button
                type="button"
                onClick={selectedFieldActions.onClear}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {renderActiveFilter()}
          </div>
        </section>
      </div>

      <div className="flex h-14 items-center justify-between border-t border-[var(--border)] bg-[var(--surface)] px-5">
        <p className="text-xs text-[var(--text-muted)]">
          {getFilterMeta(selectedField).label}
        </p>

        <p className="text-sm font-semibold text-[var(--text-secondary)]">
          {selectedCount} of {totalCount}
        </p>
      </div>
    </div>
  );
}
