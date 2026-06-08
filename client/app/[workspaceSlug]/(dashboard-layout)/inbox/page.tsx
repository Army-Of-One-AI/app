/* eslint-disable @next/next/no-img-element */
"use client";

import { apiClient } from "@/shared/api/apiClient";
import { classNames } from "@/shared/styles/classNames";
import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import {
  Bell,
  Check,
  CircleDot,
  Clock,
  Filter,
  FolderKanban,
  Inbox,
  Loader2,
  MessageCircle,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type InboxItemType =
  | "TASK_ASSIGNED"
  | "PROJECT_ADDED"
  | "WORKSPACE_INVITED"
  | "COMMENT_MENTIONED"
  | "DUE_DATE_CHANGED";

type InboxFilterType = InboxItemType | "ALL";

type InboxItem = {
  id: string;
  userId: string;
  actorId: string | null;
  workspaceId: string | null;
  projectId: string | null;
  taskId: string | null;
  inviteId: string | null;
  type: InboxItemType;
  title: string;
  message: string | null;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  actor?: {
    id: string;
    username: string;
    fullName: string | null;
    avatarURL: string | null;
  } | null;
};

const FILTERS: { label: string; value: InboxFilterType }[] = [
  { label: "All notifications", value: "ALL" },
  { label: "Assigned tasks", value: "TASK_ASSIGNED" },
  { label: "Projects", value: "PROJECT_ADDED" },
  { label: "Workspace invites", value: "WORKSPACE_INVITED" },
  { label: "Mentions", value: "COMMENT_MENTIONED" },
  { label: "Due dates", value: "DUE_DATE_CHANGED" },
];

async function getInboxItems() {
  const response = await apiClient.get<InboxItem[]>("/inbox");
  return response.data;
}

function useInboxItems() {
  return useQuery({
    queryKey: ["inbox-items"],
    queryFn: getInboxItems,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,

    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 10_000,
  });
}

function getInitials(name?: string | null) {
  if (!name) return "U";

  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatInboxTime(date: string) {
  return DateTime.fromISO(date).toRelative({ style: "narrow" }) ?? "";
}

function getInboxTypeMeta(type: InboxItemType) {
  switch (type) {
    case "TASK_ASSIGNED":
      return {
        label: "Task assigned",
        icon: Bell,
      };
    case "PROJECT_ADDED":
      return {
        label: "Project",
        icon: FolderKanban,
      };
    case "WORKSPACE_INVITED":
      return {
        label: "Invite",
        icon: UserPlus,
      };
    case "COMMENT_MENTIONED":
      return {
        label: "Mention",
        icon: MessageCircle,
      };
    case "DUE_DATE_CHANGED":
      return {
        label: "Due date",
        icon: Clock,
      };
  }
}

function getMetadataText(
  metadata: Record<string, unknown> | null,
  key: string
) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : null;
}

function InboxAvatar({ item }: { item: InboxItem }) {
  const name = item.actor?.fullName || item.actor?.username || "User";
  const meta = getInboxTypeMeta(item.type);
  const Icon = meta.icon;

  return (
    <div className="relative shrink-0">
      {item.actor?.avatarURL ? (
        <img
          src={item.actor.avatarURL}
          alt={name}
          className="size-10 rounded-full object-cover ring-1 ring-black/5"
        />
      ) : (
        <div className="flex size-10 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-xs font-semibold text-[var(--text-primary)] ring-1 ring-black/5">
          {getInitials(name)}
        </div>
      )}

      <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-[var(--surface-primary)] bg-[var(--surface-secondary)] text-[var(--text-secondary)]">
        <Icon className="size-3" />
      </div>
    </div>
  );
}

function EmptyState({
  title = "You’re all caught up",
  description = "New assignments, invites, mentions, and due date changes will appear here.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--text-secondary)]">
        <Inbox className="size-8 stroke-[1.6]" />
      </div>

      <p className="text-sm font-semibold text-[var(--text-primary)]">
        {title}
      </p>

      <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
        {description}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Loader2 className="size-5 animate-spin text-[var(--text-secondary)]" />
    </div>
  );
}

export default function InboxPage() {
  const { data = [], isLoading } = useInboxItems();

  const filterRef = useRef<HTMLDivElement>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<InboxFilterType>("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const activeFilter =
    FILTERS.find((filter) => filter.value === selectedType) ?? FILTERS[0];

  const unreadCount = useMemo(() => {
    return data.filter((item) => !item.readAt).length;
  }, [data]);

  const filteredItems = useMemo(() => {
    if (selectedType === "ALL") return data;
    return data.filter((item) => item.type === selectedType);
  }, [data, selectedType]);

  const selectedItem = useMemo(() => {
    return filteredItems.find((item) => item.id === selectedId) ?? null;
  }, [filteredItems, selectedId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!filterRef.current?.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex h-[calc(100vh-1px)] overflow-hidden bg-[var(--surface-primary)] text-[var(--text-primary)]">
      <aside
        className={`flex w-[390px] shrink-0 flex-col border-r ${classNames.border}`}
      >
        <header className={`border-b ${classNames.border} px-4 py-3`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold">Inbox</h1>

                {unreadCount > 0 && (
                  <span className="rounded-full bg-[var(--surface-secondary)] px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Tasks, invites, mentions, and project updates.
              </p>
            </div>

            <div ref={filterRef} className="relative shrink-0">
              <button
                onClick={() => setShowFilters((prev) => !prev)}
                className={[
                  "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition",
                  selectedType !== "ALL"
                    ? `${classNames.border} bg-[var(--surface-secondary)] text-[var(--text-primary)]`
                    : `${classNames.border} text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]`,
                ].join(" ")}
              >
                <Filter className="size-3.5" />
                <span>
                  {selectedType === "ALL" ? "Filter" : activeFilter.label}
                </span>
              </button>

              {showFilters && (
                <div
                  className={`absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border ${classNames.border} ${classNames.surface} p-1 shadow-xl`}
                >
                  <div className="px-3 py-2">
                    <p className="text-xs font-medium text-[var(--text-secondary)]">
                      Show
                    </p>
                  </div>

                  {FILTERS.map((filter) => {
                    const isActive = selectedType === filter.value;

                    return (
                      <button
                        key={filter.value}
                        onClick={() => {
                          setSelectedType(filter.value);
                          setSelectedId(null);
                          setShowFilters(false);
                        }}
                        className={[
                          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition",
                          isActive
                            ? "bg-[var(--surface-secondary)] text-[var(--text-primary)]"
                            : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]",
                        ].join(" ")}
                      >
                        <span>{filter.label}</span>
                        {isActive && <Check className="size-4" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <LoadingState />
          ) : filteredItems.length === 0 ? (
            <EmptyState
              title="No notifications found"
              description="Try changing the filter or check back when there are new updates."
            />
          ) : (
            <div className="py-2">
              {filteredItems.map((item) => {
                const isSelected = selectedId === item.id;
                const isUnread = !item.readAt;
                const meta = getInboxTypeMeta(item.type);

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={[
                      "group flex w-full gap-3 px-4 py-3 text-left transition",
                      isSelected
                        ? "bg-[var(--surface-secondary)]"
                        : "hover:bg-[var(--surface-secondary)]",
                    ].join(" ")}
                  >
                    <InboxAvatar item={item} />

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span className="rounded-md bg-[var(--surface-secondary)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
                          {meta.label}
                        </span>

                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                            {formatInboxTime(item.createdAt)}
                          </span>

                          {isUnread && (
                            <span className="size-2 rounded-full bg-[var(--text-primary)]" />
                          )}
                        </div>
                      </div>

                      <p
                        className={[
                          "truncate text-sm",
                          isUnread
                            ? "font-semibold text-[var(--text-primary)]"
                            : "font-medium text-[var(--text-secondary)]",
                        ].join(" ")}
                      >
                        {item.title}
                      </p>

                      {item.message && (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-secondary)]">
                          {item.message}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1">
        {isLoading ? (
          <LoadingState />
        ) : selectedItem ? (
          <div className="mx-auto flex w-full max-w-3xl flex-col px-8 py-10">
            <div className="mb-8 flex items-start gap-4">
              <InboxAvatar item={selectedItem} />

              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[var(--surface-secondary)] px-2 py-1 text-xs font-medium text-[var(--text-secondary)]">
                    {getInboxTypeMeta(selectedItem.type).label}
                  </span>

                  {!selectedItem.readAt && (
                    <span className="flex items-center gap-1 rounded-md bg-[var(--surface-secondary)] px-2 py-1 text-xs font-medium text-[var(--text-secondary)]">
                      <CircleDot className="size-3" />
                      Unread
                    </span>
                  )}

                  <span className="text-xs text-[var(--text-secondary)]">
                    {formatInboxTime(selectedItem.createdAt)}
                  </span>
                </div>

                <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                  {selectedItem.title}
                </h2>

                {selectedItem.message && (
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    {selectedItem.message}
                  </p>
                )}
              </div>
            </div>

            <div
              className={`rounded-2xl border ${classNames.border} bg-[var(--surface-primary)] p-5`}
            >
              <p className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                Details
              </p>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-6">
                  <span className="text-[var(--text-secondary)]">Type</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {getInboxTypeMeta(selectedItem.type).label}
                  </span>
                </div>

                <div className="flex justify-between gap-6">
                  <span className="text-[var(--text-secondary)]">Created</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {DateTime.fromISO(selectedItem.createdAt).toFormat(
                      "dd LLL yyyy, HH:mm"
                    )}
                  </span>
                </div>

                {selectedItem.actor && (
                  <div className="flex justify-between gap-6">
                    <span className="text-[var(--text-secondary)]">Actor</span>
                    <span className="font-medium text-[var(--text-primary)]">
                      {selectedItem.actor.fullName ||
                        selectedItem.actor.username}
                    </span>
                  </div>
                )}

                {getMetadataText(selectedItem.metadata, "workspaceName") && (
                  <div className="flex justify-between gap-6">
                    <span className="text-[var(--text-secondary)]">
                      Workspace
                    </span>
                    <span className="font-medium text-[var(--text-primary)]">
                      {getMetadataText(selectedItem.metadata, "workspaceName")}
                    </span>
                  </div>
                )}

                {getMetadataText(selectedItem.metadata, "projectName") && (
                  <div className="flex justify-between gap-6">
                    <span className="text-[var(--text-secondary)]">
                      Project
                    </span>
                    <span className="font-medium text-[var(--text-primary)]">
                      {getMetadataText(selectedItem.metadata, "projectName")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState />
          </div>
        )}
      </main>
    </div>
  );
}
