'use client'

import { ProjectMember } from "@/features/projects/types"
import { taskStatusConfig } from "@/shared/styles/classNames"
import { TaskPriority, TaskStatus } from "@/shared/types/enums"
import { useState } from "react"

export const UNASSIGNED_MEMBER_ID = "__unassigned__";

const FILTER_FIELDS = [
    "Assignee", "Status", "Priority", "Reporter"
] as const

const fieldItemClassName = "py-[6px] bg-[var(--surface)] w-full border-l-2 border-transparent relative cursor-pointer hover:brightness-150 transition-all"
const selectedFieldItemClassName = "!border-[var(--primary)]"

type Props = {
    selectedStatuses?: TaskStatus[],
    onStatusClicked?: (clickedStatus: TaskStatus) => void;

    selectedPriorities?: TaskPriority[],
    onPriorityClicked?: (clickedPriority: TaskPriority) => void;

    members?: ProjectMember[]

    selectedAssigneeIds?: string[];
    onAssigneeClicked?: (memberId: string) => void;

    selectedReporterIds?: string[];
    onReporterClicked?: (memberId: string) => void;
}

export default function BoardFilters({
    selectedStatuses,
    onStatusClicked,
    selectedPriorities,
    onPriorityClicked,
    selectedAssigneeIds,
    onAssigneeClicked,
    onReporterClicked,
    selectedReporterIds,
    members
}: Props) {
    const [selectedField, setSelectedField] = useState<(typeof FILTER_FIELDS)[number]>(FILTER_FIELDS[0])

    const renderStatusFilter = () => {
        return (
            <div className="space-y-1">
                {Object.values(TaskStatus).map((status) => {
                    const isSelected = selectedStatuses?.includes(status);

                    return (
                        <label
                            key={status}
                            className="flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-[var(--secondary)]"
                        >
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => onStatusClicked?.(status)}
                                className="h-4 w-4"
                            />

                            <span
                                style={{
                                    background: taskStatusConfig[status].bg,
                                    color: taskStatusConfig[status].text,
                                    opacity: isSelected ? 1 : 0.5,
                                }}
                                className="px-2 py-0.5 rounded text-xs font-medium"
                            >
                                {taskStatusConfig[status].label}
                            </span>
                        </label>
                    );
                })}
            </div>
        );
    };

    const renderPriorityFilter = () => {
        return (
            <div className="flex flex-col">
                {Object.values(TaskPriority).map((priority) => (
                    <label
                        key={priority}
                        className="
            flex items-center gap-2
            px-2 py-1.5
            rounded-md
            cursor-pointer
            hover:bg-[var(--secondary)]
            transition-colors
          "
                    >
                        <input
                            type="checkbox"
                            checked={selectedPriorities?.includes(priority)}
                            onChange={() => onPriorityClicked?.(priority)}
                            className="h-4 w-4"
                        />

                        <span className="text-sm text-[var(--text-primary)]">
                            {priority}
                        </span>
                    </label>
                ))}
            </div>
        );
    };

    const renderMemberFilter = (
        selectedIds: string[] = [],
        type: "reporter" | "assignee",
        onClicked?: (memberId: string) => void
    ) => {
        return (
            <div className="space-y-1">
                <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[var(--secondary)]">
                    {type === 'assignee' && <>
                        <input
                            type="checkbox"
                            checked={selectedIds.includes(UNASSIGNED_MEMBER_ID)}
                            onChange={() => onClicked?.(UNASSIGNED_MEMBER_ID)}
                            className="h-4 w-4"
                        />

                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--secondary)] text-xs font-semibold text-[var(--text-secondary)]">
                            ?
                        </div>
                    </>
                    }

                    <span className="text-sm text-[var(--text-primary)]">
                        Unassigned
                    </span>
                </label>

                {(members ?? []).map((member) => {
                    const isSelected = selectedIds.includes(member.id);
                    const name = member.fullName || member.username || member.email;
                    const initial = name.slice(0, 1).toUpperCase();

                    return (
                        <label
                            key={member.id}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[var(--secondary)]"
                        >
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => onClicked?.(member.id)}
                                className="h-4 w-4"
                            />

                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-semibold text-[var(--on-primary)]">
                                {member.avatarURL ? (
                                    <img
                                        src={member.avatarURL}
                                        alt={name}
                                        className="h-full w-full rounded-full object-cover"
                                    />
                                ) : (
                                    initial
                                )}
                            </div>

                            <span className="truncate text-sm text-[var(--text-primary)]">
                                {name}
                            </span>
                        </label>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex w-150 max-w-screen aspect-video max-h-screen flex-col overflow-hidden bg-[var(--surface)] ">
            <div className="flex flex-1 flex-row px-6 py-4">
                <div className="flex w-1/2 flex-col gap-1 pr-6">
                    {FILTER_FIELDS.map((field) => (
                        <div
                            onClick={() => setSelectedField(field)}
                            className={`${fieldItemClassName} ${field === selectedField && selectedFieldItemClassName
                                }`}
                            key={field}
                        >
                            {selectedField === field && (
                                <div className="absolute inset-0 bg-[var(--primary)] opacity-30" />
                            )}
                            <h1 className="px-4 text-md font-light text-foreground">
                                {field}
                            </h1>
                        </div>
                    ))}
                </div>

                <div className="w-px bg-[var(--border)]" />

                <div className="w-1/2 pl-6">
                    {selectedField === "Assignee" &&
                        renderMemberFilter(selectedAssigneeIds, "assignee", onAssigneeClicked)}

                    {selectedField === "Reporter" &&
                        renderMemberFilter(selectedReporterIds, "reporter", onReporterClicked)}

                    {selectedField === "Priority" && renderPriorityFilter()}
                    {selectedField === "Status" && renderStatusFilter()}
                </div>
            </div>

            <div className="flex h-16 items-center justify-end border-t border-[var(--border)] bg-[var(--surface)] px-6">
                <p className="text-sm font-semibold text-[var(--text-secondary)]">
                    {selectedField === "Status" &&
                        `${selectedStatuses?.length ?? 0} of ${Object.values(TaskStatus).length}`}

                    {selectedField === "Priority" &&
                        `${selectedPriorities?.length ?? 0} of ${Object.values(TaskPriority).length}`}

                    {selectedField === "Reporter" &&
                        `${selectedReporterIds?.length ?? 0} of ${members?.length ?? 0}`}

                    {selectedField === "Assignee" &&
                        `${selectedAssigneeIds?.length ?? 0} of ${members?.length ? members.length + 1 : 1}`}
                </p>
            </div>
        </div>
    );
}
