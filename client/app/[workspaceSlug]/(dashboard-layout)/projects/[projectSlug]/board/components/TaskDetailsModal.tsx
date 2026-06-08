/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  TaskActivityItem,
  Task,
  TaskDetails,
  Epic,
} from "@/features/tasks/types";
import { TaskActivity, TaskPriority, TaskStatus } from "@/shared/types/enums";
import RichTextEditor from "@/shared/ui/RichTextEditor";
import Button from "@/shared/ui/Button";
import useGetTaskById from "@/features/tasks/hooks/useGetTaskById";
import useUpdateTask from "@/features/tasks/hooks/useUpdateTask";
import useCreateTask from "@/features/tasks/hooks/useCreateTask";
import { parseRichText } from "@/shared/utils/helpers";
import { ProjectMember } from "@/features/projects/types";
import { classNames, taskStatusConfig } from "@/shared/styles/classNames";
import Popover from "@/shared/ui/Popover";
import TaskActions from "./TaskActions";
import { ChevronDown, Ellipsis, X } from "lucide-react";
import useDeleteTask from "@/features/tasks/hooks/useDeleteTask";
import TaskVerifyModal from "./TaskVerifyModal";
import useArchiveTask from "@/features/tasks/hooks/useArchiveTask";
import Link from "next/link";
import useTaskActivities from "@/features/tasks/hooks/useTaskActivities";
import useSlugs from "@/shared/hooks/useSlugs";
import SearchBar from "@/shared/ui/SearchBar";

type Props = {
  taskId: string;
  canUpdateTask: boolean;
  canAssignTask: boolean;
  members: ProjectMember[];
  epics: Epic[];
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onClickSubtask: (subtask: Task) => void;
};

type TaskDescription = {
  html: string;
  plainText: string;
};

const emptyDescription: TaskDescription = {
  html: "",
  plainText: "",
};

const inlineControlClassName =
  "bg-transparent outline-none disabled:cursor-not-allowed disabled:opacity-70";

export default function TaskDetailsModal({
  taskId,
  members,
  canUpdateTask,
  canAssignTask,
  onClose,
  onUpdate,
  onClickSubtask,
  epics,
}: Props) {
  const queryClient = useQueryClient();

  const slugs = useSlugs();
  const workspaceSlug = slugs.workspace.slug;
  const projectSlug = slugs.project.slug;

  const {
    data: task,
    isLoading,
    isError,
    refetch: refetchTaskDetails,
  } = useGetTaskById(taskId, projectSlug, workspaceSlug);

  const typedTask = task as TaskDetails | undefined;

  const {
    data: taskActivitiesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching: isRefetchingActivities,
  } = useTaskActivities({
    projectSlug,
    workspaceSlug,
    taskId,
    limit: 5,
  });

  const taskActivities = useMemo(() => {
    return taskActivitiesData?.pages.flatMap((page) => page.items) ?? [];
  }, [taskActivitiesData]);

  const { mutateAsync: updateTask, isPending } = useUpdateTask();
  const { mutateAsync: createTask, isPending: isCreatingTask } = useCreateTask(
    workspaceSlug,
    projectSlug
  );
  const { mutateAsync: deleteTask, isPending: isDeletingTask } =
    useDeleteTask();
  const { mutateAsync: archiveTask, isPending: isArchivingTask } =
    useArchiveTask();

  const [loadedTaskId, setLoadedTaskId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState<TaskDescription>(emptyDescription);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.Todo);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.Medium);
  const [dueDate, setDueDate] = useState("");
  const [estimate, setEstimate] = useState("");

  const [assigneeId, setAssigneeId] = useState("");
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");

  const [epicId, setEpicId] = useState("");
  const [isEpicOpen, setIsEpicOpen] = useState(false);
  const [epicSearch, setEpicSearch] = useState("");

  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [isCreatingSubtask, setIsCreatingSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [subtaskAssigneeId, setSubtaskAssigneeId] = useState("");

  const [isOpenPopover, setOpenPopover] = useState(false);

  const disabled = !canUpdateTask || isPending;
  const subtaskDisabled = !canUpdateTask || isPending || isCreatingTask;

  const [isOpenDeleteTaskModal, setOpenDeleteTaskModal] = useState(false);
  const [isOpenArchiveTaskModal, setOpenArchiveTaskModal] = useState(false);

  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const selectedAssignee = useMemo(() => {
    return members.find((member) => member.id === assigneeId) ?? null;
  }, [members, assigneeId]);

  const selectedEpic = useMemo(() => {
    if (!epics || epics.length === 0) return null;

    return epics.find((epic) => epic.id === epicId) ?? null;
  }, [epics, epicId]);

  const filteredMembers = useMemo(() => {
    const keyword = assigneeSearch.toLowerCase().trim();

    if (!keyword) return members;

    return members.filter((member) =>
      [member.fullName, member.username, member.email]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(keyword))
    );
  }, [members, assigneeSearch]);

  const filteredEpics = useMemo(() => {
    if (!epics || epics.length === 0) return [];

    const keyword = epicSearch.toLowerCase().trim();

    if (!keyword) return epics;

    return epics.filter((epic) => epic.title.toLowerCase().includes(keyword));
  }, [epics, epicSearch]);

  const subtaskProgress = useMemo(() => {
    if (subtasks.length === 0) return 0;

    const doneCount = subtasks.filter(
      (subtask) => subtask.status === TaskStatus.Done
    ).length;

    return Math.round((doneCount / subtasks.length) * 100);
  }, [subtasks]);

  useEffect(() => {
    if (!typedTask) return;

    setTitle(typedTask.title);
    setDescription(parseRichText(typedTask.description));
    setStatus(typedTask.status);
    setPriority(typedTask.priority);
    setDueDate(typedTask.dueDate ? typedTask.dueDate.slice(0, 10) : "");
    setEstimate(typedTask.estimate?.toString() ?? "");
    setAssigneeId(typedTask.assignee?.id ?? "");
    setIsAssigneeOpen(false);
    setAssigneeSearch("");

    setEpicId(typedTask.epic?.id ?? "");
    setIsEpicOpen(false);
    setEpicSearch("");

    setSubtasks(typedTask.subtasks ?? []);
    setIsCreatingSubtask(false);
    setSubtaskTitle("");
    setSubtaskAssigneeId("");

    setLoadedTaskId(typedTask.id);
  }, [typedTask]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!typedTask || !title.trim()) return;

    const updatedTask = await updateTask({
      workspaceSlug,
      projectSlug,
      taskId,

      title: title.trim(),
      description: description.plainText.trim() ? description : null,
      status,
      priority,
      dueDate: dueDate || null,
      estimate: estimate ? Number(estimate) : null,
      assigneeId: assigneeId || null,
      epicId: selectedEpic ? selectedEpic.id : null,
    });

    onUpdate(updatedTask);

    await Promise.allSettled([
      queryClient.invalidateQueries({
        queryKey: ["get-task-activities", workspaceSlug, projectSlug, taskId],
      }),
      refetchTaskDetails(),
    ]);

    onClose();
  };

  const handleCreateSubtask = async () => {
    if (!typedTask || !subtaskTitle.trim()) return;

    const createdSubtask = await createTask(
      {
        title: subtaskTitle.trim(),
        description: {
          html: "<div></div>",
          plainText: "",
        },
        parentTaskId: typedTask.id,
        priority: "Medium",
        status: "Todo",
      },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: ["get-task-by-id", taskId, projectSlug, workspaceSlug],
          });

          setSubtaskTitle("");
          setSubtaskAssigneeId("");
          setIsCreatingSubtask(false);
        },
      }
    );

    setSubtasks((curr) => [...curr, createdSubtask]);
  };

  if (isLoading || !typedTask || loadedTaskId !== typedTask.id) {
    return (
      <div
        className={`flex h-[82vh] w-[92vw] max-w-305 items-center justify-center text-sm ${classNames.text.secondary}`}
      >
        Loading task...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[82vh] w-[92vw] max-w-305 flex-col items-center justify-center gap-3">
        <p className={`text-sm ${classNames.text.secondary}`}>
          Failed to load task.
        </p>

        <Button type="button" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex w-full flex-col ${classNames.background}`}>
      <div className="flex w-full items-center justify-end px-4">
        <Popover
          position="right"
          onClose={() => setOpenPopover(false)}
          isOpen={isOpenPopover}
          content={
            <TaskActions
              onClickDelete={() => {
                setOpenDeleteTaskModal(true);
                setOpenPopover(false);
              }}
              onClickArchive={() => {
                setOpenArchiveTaskModal(true);
                setOpenPopover(false);
              }}
            />
          }
        >
          <div className="flex items-center justify-end">
            <button
              className={`relative flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-sm hover:bg-[var(--border)] ${
                isOpenPopover && `border border-[var(--btn-primary-bg)]`
              }`}
              type="button"
              onClick={() => setOpenPopover((curr) => !curr)}
            >
              <div
                className={`${
                  isOpenPopover && `bg-[var(--btn-primary-bg)] opacity-20`
                } absolute h-full w-full`}
              />

              <Ellipsis className="relative transition-colors" size={20} />
            </button>

            <button
              onClick={onClose}
              className="relative flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-sm hover:bg-[var(--border)]"
              type="button"
            >
              <div className="absolute h-full w-full" />
              <X className="relative transition-colors" size={20} />
            </button>
          </div>
        </Popover>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex h-[82vh] w-[92vw] max-w-305 flex-col overflow-hidden"
      >
        <div className="grid min-h-0 flex-1 grid-cols-[1fr_420px] gap-8 overflow-y-auto px-7 py-6">
          <section className="min-w-0 space-y-7">
            <input
              disabled={disabled}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full text-2xl font-semibold ${classNames.text.primary} ${inlineControlClassName}`}
            />

            <div>
              <h3 className="mb-2 font-semibold text-[var(--text-primary)]">
                Description
              </h3>

              <RichTextEditor
                key={typedTask.id}
                value={description}
                onChange={setDescription}
              />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-[var(--text-primary)]">
                  Subtasks
                </h3>

                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  {subtasks.length === 0
                    ? "No subtasks"
                    : `${subtaskProgress}% completed`}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-[var(--secondary)]">
                <div
                  className="h-full rounded-full bg-[var(--primary)] transition-all"
                  style={{ width: `${subtaskProgress}%` }}
                />
              </div>

              <div className="mt-3 overflow-hidden rounded-lg border border-[var(--border)]">
                <div className="grid grid-cols-[32px_minmax(0,1fr)_180px_90px] bg-[var(--secondary)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]">
                  <span />
                  <span>Subtask</span>
                  <span>Assignee</span>
                  <span>Status</span>
                </div>

                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="grid grid-cols-[32px_minmax(0,1fr)_180px_90px] items-center border-t border-[var(--border)] px-3 py-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={subtask.status === TaskStatus.Done}
                      readOnly
                      className="h-4 w-4"
                    />

                    <span
                      onClick={() => onClickSubtask(subtask)}
                      className="min-w-0 cursor-pointer truncate text-[var(--text-primary)] hover:underline"
                    >
                      {subtask.title}
                    </span>

                    <span className="min-w-0 truncate text-xs text-[var(--text-secondary)]">
                      {subtask.assignee?.fullName ||
                        subtask.assignee?.username ||
                        "Unassigned"}
                    </span>

                    <span className="text-xs text-[var(--text-secondary)]">
                      {subtask.status.split("_").join(" ")}
                    </span>
                  </div>
                ))}

                {isCreatingSubtask ? (
                  <div className="grid grid-cols-[32px_minmax(0,1fr)_180px_90px_92px] items-center border-t border-[var(--border)] px-3 py-2 text-sm">
                    <input type="checkbox" disabled className="h-4 w-4" />

                    <input
                      autoFocus
                      disabled={subtaskDisabled}
                      value={subtaskTitle}
                      onChange={(e) => setSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setIsCreatingSubtask(false);
                          setSubtaskTitle("");
                          setSubtaskAssigneeId("");
                        }

                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCreateSubtask();
                        }
                      }}
                      placeholder="Create subtask"
                      className={`min-w-0 ${inlineControlClassName} ${classNames.input.text} ${classNames.input.placeholder}`}
                    />

                    <span />
                    <span />

                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        disabled={subtaskDisabled || !subtaskTitle.trim()}
                        onClick={handleCreateSubtask}
                        className="rounded-md px-2 py-1 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isCreatingTask ? "Adding..." : "Add"}
                      </button>

                      <button
                        type="button"
                        disabled={subtaskDisabled}
                        onClick={() => {
                          setIsCreatingSubtask(false);
                          setSubtaskTitle("");
                          setSubtaskAssigneeId("");
                        }}
                        className="rounded-md px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={subtaskDisabled}
                    onClick={() => setIsCreatingSubtask(true)}
                    className="flex w-full items-center gap-3 border-t border-[var(--border)] px-3 py-3 text-left text-sm hover:bg-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <span className="text-[var(--primary)]">
                      + Create subtask
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-[var(--text-primary)]">
                Activity
              </h3>

              <div className="overflow-hidden rounded-lg border border-[var(--border)]">
                <div className="border-b border-[var(--border)] p-4">
                  <input
                    placeholder="Add a comment..."
                    className={`w-full text-sm ${classNames.input.text} ${classNames.input.placeholder} ${inlineControlClassName}`}
                  />
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {isRefetchingActivities && !isFetchingNextPage && (
                    <div className="border-b border-[var(--border)] px-4 py-2 text-xs text-[var(--text-secondary)]">
                      Updating activity...
                    </div>
                  )}

                  {taskActivities.length ? (
                    taskActivities.map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))
                  ) : (
                    <div className="px-4 py-6 text-sm text-[var(--text-secondary)]">
                      No activity yet.
                    </div>
                  )}

                  {hasNextPage && (
                    <div className="border-t border-[var(--border)] p-3">
                      <button
                        type="button"
                        disabled={isFetchingNextPage}
                        onClick={() => fetchNextPage()}
                        className="w-full rounded-md px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isFetchingNextPage ? "Loading..." : "Load more"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-3">
            <div className="relative">
              <button
                style={{
                  background: taskStatusConfig[status].bg,
                  color: taskStatusConfig[status].text,
                }}
                type="button"
                disabled={disabled}
                onClick={() => setIsStatusOpen((curr) => !curr)}
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md px-4 text-sm font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {Object.entries(taskStatusConfig).find(
                  ([key]) => key === status
                )?.[1].label ?? status}

                <span
                  className={`transition-transform ${
                    isStatusOpen ? "rotate-180" : ""
                  }`}
                >
                  <ChevronDown size={20} />
                </span>
              </button>

              {isStatusOpen && (
                <div className="absolute left-0 top-full z-50 mt-3 w-80 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-2xl shadow-black/40">
                  <div className="py-3">
                    {Object.entries(taskStatusConfig).map(([key, value]) => {
                      const isSelected = key === status;

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setStatus(key as TaskStatus);
                            setIsStatusOpen(false);
                          }}
                          className={`flex w-full items-center px-6 py-2.5 text-left transition hover:bg-[var(--secondary)] ${
                            isSelected
                              ? "border-l-2 border-[var(--primary)] bg-[var(--secondary)]"
                              : ""
                          }`}
                        >
                          <span
                            style={{
                              background: value.bg,
                              color: value.text,
                            }}
                            className="rounded-md px-2 py-0.5 text-xs font-black uppercase tracking-wide"
                          >
                            {value.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <div className="border-b border-[var(--border)] px-4 py-3">
                <h3 className="font-semibold text-[var(--text-primary)]">
                  Details
                </h3>
              </div>

              <div className="space-y-5 px-5 py-5 text-sm">
                <DetailRow label="Assignee">
                  <div className="relative">
                    <button
                      type="button"
                      disabled={!canAssignTask || isPending}
                      onClick={() => setIsAssigneeOpen((curr) => !curr)}
                      className="flex w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left hover:bg-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {selectedAssignee ? (
                        <>
                          <MemberAvatar member={selectedAssignee} size="sm" />
                          <span className="min-w-0 flex-1 truncate text-[var(--text-primary)]">
                            {selectedAssignee.fullName ||
                              selectedAssignee.username}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--secondary)] text-xs font-semibold text-[var(--text-secondary)]">
                            —
                          </div>
                          <span className="text-[var(--text-secondary)]">
                            Unassigned
                          </span>
                        </>
                      )}
                    </button>

                    {isAssigneeOpen && (
                      <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg">
                        <div className="border-b border-[var(--border)] p-2">
                          <SearchBar
                            autoFocus
                            value={assigneeSearch}
                            onChange={setAssigneeSearch}
                            placeholder="Search member..."
                          />
                        </div>

                        <div className="max-h-60 overflow-y-auto py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setAssigneeId("");
                              setIsAssigneeOpen(false);
                              setAssigneeSearch("");
                            }}
                            className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[var(--secondary)]"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--secondary)] text-sm font-semibold text-[var(--text-secondary)]">
                              —
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-medium text-[var(--text-primary)]">
                                Unassigned
                              </p>
                              <p className="truncate text-xs text-[var(--text-secondary)]">
                                No assignee
                              </p>
                            </div>
                          </button>

                          {filteredMembers.map((member) => {
                            const isSelected = member.id === assigneeId;

                            return (
                              <button
                                key={member.id}
                                type="button"
                                onClick={() => {
                                  setAssigneeId(member.id);
                                  setIsAssigneeOpen(false);
                                  setAssigneeSearch("");
                                }}
                                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[var(--secondary)]"
                              >
                                <MemberAvatar member={member} size="md" />

                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-medium text-[var(--text-primary)]">
                                    {member.fullName || member.username}
                                  </p>

                                  <p className="truncate text-xs text-[var(--text-secondary)]">
                                    {member.email}
                                  </p>
                                </div>

                                {isSelected && (
                                  <span className="text-xs font-semibold text-[var(--primary)]">
                                    Selected
                                  </span>
                                )}
                              </button>
                            );
                          })}

                          {filteredMembers.length === 0 && (
                            <div className="px-3 py-5 text-center text-sm text-[var(--text-secondary)]">
                              No members found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </DetailRow>

                <DetailRow label="Epic">
                  <div className="relative">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => setIsEpicOpen((curr) => !curr)}
                      className="flex w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left hover:bg-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {selectedEpic ? (
                        <>
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor:
                                selectedEpic.color ?? "var(--primary)",
                            }}
                          />

                          <span className="min-w-0 flex-1 truncate text-[var(--text-primary)]">
                            {selectedEpic.title}
                          </span>
                        </>
                      ) : (
                        <span className="text-[var(--text-secondary)]">
                          No epic
                        </span>
                      )}
                    </button>

                    {isEpicOpen && (
                      <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg">
                        <div className="border-b border-[var(--border)] p-2">
                          <SearchBar
                            autoFocus
                            value={epicSearch}
                            onChange={setEpicSearch}
                            placeholder="Search epic..."
                          />
                        </div>

                        <div className="max-h-60 overflow-y-auto py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEpicId("");
                              setIsEpicOpen(false);
                              setEpicSearch("");
                            }}
                            className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[var(--secondary)]"
                          >
                            <span className="text-sm text-[var(--text-secondary)]">
                              No epic
                            </span>
                          </button>

                          {filteredEpics.map((epic) => {
                            const isSelected = epic.id === epicId;

                            return (
                              <button
                                key={epic.id}
                                type="button"
                                onClick={() => {
                                  setEpicId(epic.id);
                                  setIsEpicOpen(false);
                                  setEpicSearch("");
                                }}
                                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[var(--secondary)]"
                              >
                                <span
                                  className="h-3 w-3 rounded-full"
                                  style={{
                                    backgroundColor:
                                      epic.color ?? "var(--primary)",
                                  }}
                                />

                                <span className="min-w-0 flex-1 truncate font-medium text-[var(--text-primary)]">
                                  {epic.title}
                                </span>

                                {isSelected && (
                                  <span className="text-xs font-semibold text-[var(--primary)]">
                                    Selected
                                  </span>
                                )}
                              </button>
                            );
                          })}

                          {filteredEpics.length === 0 && (
                            <div className="px-3 py-5 text-center text-sm text-[var(--text-secondary)]">
                              No epics found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </DetailRow>

                <DetailRow label="Priority">
                  <select
                    disabled={disabled}
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as TaskPriority)
                    }
                    className={inlineControlClassName}
                  >
                    {Object.values(TaskPriority).map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                </DetailRow>

                <DetailRow label="Parent">
                  {typedTask.parentTask ? (
                    <Link
                      className="text-[var(--steel-blue)] hover:underline brightness-105"
                      href={`/${workspaceSlug}/projects/${projectSlug}/board?selectedTask=${typedTask.parentTask.id}`}
                    >
                      {typedTask.parentTask.title}
                    </Link>
                  ) : (
                    "None"
                  )}
                </DetailRow>

                <DetailRow label="Due date">
                  <input
                    disabled={disabled}
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={inlineControlClassName}
                  />
                </DetailRow>

                <DetailRow label="Labels">None</DetailRow>

                <DetailRow label="Estimate">
                  <input
                    disabled={disabled}
                    type="number"
                    min={0}
                    value={estimate}
                    onChange={(e) => setEstimate(e.target.value)}
                    placeholder="None"
                    className={`w-24 ${inlineControlClassName}`}
                  />
                </DetailRow>

                <DetailRow label="Reporter">
                  {typedTask.creator?.fullName ?? "Unknown"}
                </DetailRow>
              </div>
            </div>

            <Button
              type="submit"
              disabled={disabled || !title.trim()}
              className="w-full"
            >
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </aside>
        </div>
      </form>

      <TaskVerifyModal
        mode="delete"
        taskTitle={typedTask.title}
        isOpen={isOpenDeleteTaskModal}
        onClose={() => setOpenDeleteTaskModal(false)}
        isLoading={isDeletingTask}
        onConfirm={async () => {
          await deleteTask(
            {
              taskId,
              projectSlug,
              workspaceSlug,
            },
            {
              onSuccess: async () => {
                await queryClient.invalidateQueries({
                  queryKey: [
                    "get-tasks-by-project-slug",
                    projectSlug,
                    workspaceSlug,
                  ],
                });
                setOpenDeleteTaskModal(false);
                onClose();
              },
            }
          );
        }}
      />

      <TaskVerifyModal
        mode="archive"
        taskTitle={typedTask.title}
        isOpen={isOpenArchiveTaskModal}
        onClose={() => setOpenArchiveTaskModal(false)}
        isLoading={isArchivingTask}
        onConfirm={async () => {
          await archiveTask(
            {
              taskId,
              projectSlug,
              workspaceSlug,
            },
            {
              onSuccess: async () => {
                await queryClient.invalidateQueries({
                  queryKey: [
                    "get-tasks-by-project-slug",
                    projectSlug,
                    workspaceSlug,
                  ],
                });
                setOpenArchiveTaskModal(false);
                onClose();
              },
            }
          );
        }}
      />
    </div>
  );
}

function ActivityItem({ activity }: { activity: TaskActivityItem }) {
  return (
    <div className="flex gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0">
      {activity.actor.avatarURL ? (
        <img
          src={activity.actor.avatarURL}
          alt={activity.actor.fullName}
          className="h-8 w-8 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)] text-xs font-semibold text-[var(--text-secondary)]">
          {getInitial(activity.actor.fullName || "U")}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm text-[var(--text-primary)]">
          <span className="font-semibold">
            {activity.actor.fullName || "Unknown user"}
          </span>{" "}
          {renderActivityText(activity)}
        </p>

        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          {formatActivityTime(activity.createdAt)}
        </p>
      </div>
    </div>
  );
}

function renderActivityText(activity: TaskActivityItem) {
  const before = activity.metadata?.before;
  const after = activity.metadata?.after;

  switch (activity.activity) {
    case TaskActivity.TITLE_CHANGED:
      return `changed title from "${before ?? ""}" to "${after ?? ""}"`;

    case TaskActivity.DESCRIPTION_UPDATED:
      return "updated the description";

    case TaskActivity.STATUS_CHANGED:
      return `changed status from ${formatEmptyValue(
        before
      )} to ${formatEmptyValue(after)}`;

    case TaskActivity.PRIORITY_CHANGED:
      return `changed priority from ${formatEmptyValue(
        before
      )} to ${formatEmptyValue(after)}`;

    case TaskActivity.DUE_DATE_CHANGED:
      return `changed due date from ${formatActivityDate(
        before
      )} to ${formatActivityDate(after)}`;

    case TaskActivity.ASSIGNEE_CHANGED:
      return `changed assignee from ${formatEmptyValue(
        before,
        "Unassigned"
      )} to ${formatEmptyValue(after, "Unassigned")}`;

    default:
      return activity.activity.toLowerCase().replaceAll("_", " ");
  }
}

function formatEmptyValue(value: unknown, fallback = "None") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function formatActivityDate(value: unknown) {
  if (!value) return "None";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString();
}

function formatActivityTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString();
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4">
      <span className="font-semibold text-[var(--text-primary)]">{label}</span>
      <div className="min-w-0 text-[var(--text-secondary)]">{children}</div>
    </div>
  );
}

function MemberAvatar({
  member,
  size,
}: {
  member: ProjectMember;
  size: "sm" | "md";
}) {
  const className =
    size === "sm"
      ? "h-6 w-6 rounded-full object-cover"
      : "h-8 w-8 rounded-full object-cover";

  const fallbackClassName =
    size === "sm"
      ? "flex h-6 w-6 items-center justify-center rounded-full bg-[var(--secondary)] text-xs font-semibold text-[var(--text-secondary)]"
      : "flex h-8 w-8 items-center justify-center rounded-full bg-[var(--secondary)] text-xs font-semibold text-[var(--text-secondary)]";

  if (member.avatarURL) {
    return (
      <img
        src={member.avatarURL}
        alt={member.fullName || member.username}
        className={className}
      />
    );
  }

  return (
    <div className={fallbackClassName}>
      {getInitial(member.fullName || member.username)}
    </div>
  );
}

function getInitial(value: string) {
  return value.trim().charAt(0).toUpperCase();
}
