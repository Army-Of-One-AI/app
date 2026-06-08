"use client";

import useAuthentication from "@/features/auth/hooks/useAuthentication";
import useAddMemberToProject from "@/features/projects/hooks/useAddMemberToProject";
import useGetProjectDetailsBySlug from "@/features/projects/hooks/useGetProjectDetailsBySlug";
import useRemoveMemberFromProject from "@/features/projects/hooks/useRemoveMemberFromProject";
import useWorkspaceMembers from "@/features/workspaces/hooks/useWorkspaceMembers";
import { WorkspaceMember } from "@/features/workspaces/types";
import useSlugs from "@/shared/hooks/useSlugs";
import { classNames } from "@/shared/styles/classNames";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Loader2,
  Search,
  Sparkles,
  SquareCheck,
  TimerReset,
  Trash,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function ProjectActions({
  closePopover,
}: {
  closePopover: () => void;
}) {
  const slugs = useSlugs();
  const router = useRouter();
  const { userInfo } = useAuthentication();

  const [isOpenAddMember, setOpenAddMember] = useState(false);
  const [search, setSearch] = useState("");
  const [memberToAdd, setMemberToAdd] = useState<WorkspaceMember | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(
    null
  );

  const currentUserId = userInfo?.id;

  const { data: projectDetails } = useGetProjectDetailsBySlug(
    slugs.project.slug,
    slugs.workspace.slug
  );

  const { mutateAsync: addMemberToProject, isPending: isAddingMember } =
    useAddMemberToProject();

  const { mutateAsync: removeMemberFromProject, isPending: isRemovingMember } =
    useRemoveMemberFromProject();

  const { data: workspaceMembers, isLoading: isLoadingWSMembers } =
    useWorkspaceMembers(slugs.workspace.slug);

  const projectMemberIds = useMemo(() => {
    return new Set(projectDetails?.members.map((member) => member.id) ?? []);
  }, [projectDetails?.members]);

  const filteredMembers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return (workspaceMembers ?? []).filter((member) => {
      const name = member.fullName || member.username || "";
      const email = member.email || "";

      return (
        name.toLowerCase().includes(keyword) ||
        email.toLowerCase().includes(keyword)
      );
    });
  }, [workspaceMembers, search]);

  async function handleConfirmAddMember() {
    if (!memberToAdd) return;

    await addMemberToProject({
      workspaceSlug: slugs.workspace.slug,
      projectSlug: slugs.project.slug,
      targetUser: memberToAdd,
    });

    setMemberToAdd(null);
  }

  async function handleConfirmRemoveMember() {
    if (!memberToRemove) return;

    await removeMemberFromProject({
      workspaceSlug: slugs.workspace.slug,
      projectSlug: slugs.project.slug,
      targetUserId: memberToRemove.id,
    });

    setMemberToRemove(null);
  }

  const memberToAddName =
    memberToAdd?.fullName || memberToAdd?.username || "this member";

  const memberToRemoveName =
    memberToRemove?.fullName || memberToRemove?.username || "this member";

  const isRemovingYourself = memberToRemove?.id === currentUserId;

  const removeModalTitle = isRemovingYourself
    ? "Leave this project?"
    : "Remove project member?";

  const removeModalDescription = isRemovingYourself
    ? "You are about to remove yourself from this project. You may lose access unless another member adds you back."
    : `Are you sure you want to remove ${memberToRemoveName} from this project?`;

  const removeConfirmLabel = isRemovingYourself
    ? "Leave project"
    : "Remove member";

  return (
    <>
      <div
        className={`w-[250px] rounded-xl border bg-(--surface) p-1 shadow-2xl ${classNames.border}`}
      >
        <button
          type="button"
          onClick={() => setOpenAddMember((curr) => !curr)}
          className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-1 text-left text-sm text-(--text-primary) transition-all hover:bg-(--border)"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--border)/60 text-(--text-primary)">
            <UsersRound size={16} />
          </span>

          <span className="flex-1">
            <span className="block font-medium">Add member</span>
          </span>

          <ChevronRight
            size={16}
            className={`transition-transform ${
              isOpenAddMember ? "rotate-180" : "group-hover:translate-x-0.5"
            }`}
          />

          <AnimatePresence>
            {isOpenAddMember && (
              <motion.div
                initial={{ opacity: 0, x: -8, scale: 0.98 }}
                animate={{ opacity: 1, x: 8, scale: 1 }}
                exit={{ opacity: 0, x: -8, scale: 0.98 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                onClick={(event) => event.stopPropagation()}
                className={`absolute left-full top-0 z-50 w-[350px] overflow-hidden rounded-xl border bg-(--surface) shadow-2xl ${classNames.border}`}
              >
                <div className="border-b border-(--border) px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--border)/60">
                      <UserPlus size={15} />
                    </div>

                    <p className="text-sm font-semibold text-(--text-primary)">
                      Add project members
                    </p>
                  </div>

                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-(--border) bg-(--background) px-2.5 py-2">
                    <Search size={14} className="text-(--text-secondary)" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search members..."
                      className="w-full bg-transparent text-sm text-(--text-primary) outline-none placeholder:text-(--text-secondary)"
                    />
                  </div>
                </div>

                <div className="max-h-[280px] overflow-y-auto p-1">
                  {isLoadingWSMembers && <MemberSkeleton />}

                  {!isLoadingWSMembers && filteredMembers.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm font-medium text-(--text-primary)">
                        No members found
                      </p>
                      <p className="mt-1 text-xs text-(--text-secondary)">
                        Try another name or email.
                      </p>
                    </div>
                  )}

                  {!isLoadingWSMembers &&
                    filteredMembers.map((member) => {
                      const isAdded = projectMemberIds.has(member.id);
                      const isCurrentUser = member.id === currentUserId;
                      const name =
                        member.fullName || member.username || "Unnamed member";

                      return (
                        <div
                          key={member.id}
                          onClick={async () => {
                            if (!isAdded) {
                              setMemberToAdd(member);
                              return;
                            }

                            setMemberToRemove(member);
                          }}
                          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all hover:bg-(--border)"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--border) text-xs font-semibold text-(--text-primary)">
                            {name.slice(0, 1).toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                              <p className="truncate text-sm font-medium text-(--text-primary)">
                                {name}
                              </p>

                              {isCurrentUser && (
                                <span className="shrink-0 rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-500">
                                  You
                                </span>
                              )}
                            </div>

                            {member.email && (
                              <p className="truncate text-xs text-(--text-secondary)">
                                {member.email}
                              </p>
                            )}
                          </div>

                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                              isAdded
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-(--border) bg-transparent"
                            }`}
                          >
                            {isAdded && <Check size={13} strokeWidth={3} />}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        <button
          type="button"
          onClick={() => {
            router.push(
              `/${slugs.workspace.slug}/projects/${slugs.project.slug}/board?action=create`
            );
            closePopover();
          }}
          className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-1 text-left text-sm text-(--text-primary) transition-all hover:bg-(--border)"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--border)/60 text-(--text-primary)">
            <SquareCheck size={16} />
          </span>

          <span className="flex-1">
            <span className="block font-medium">Create new task</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            router.push(
              `/${slugs.workspace.slug}/projects/${slugs.project.slug}/epics?action=create`
            );
            closePopover();
          }}
          className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-1 text-left text-sm text-(--text-primary) transition-all hover:bg-(--border)"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--border)/60 text-(--text-primary)">
            <Sparkles size={16} />
          </span>

          <span className="flex-1">
            <span className="block font-medium">Create new epic</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            router.push(
              `/${slugs.workspace.slug}/projects/${slugs.project.slug}/sprints?action=create`
            );
            closePopover();
          }}
          className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-1 text-left text-sm text-(--text-primary) transition-all hover:bg-(--border)"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--border)/60 text-(--text-primary)">
            <TimerReset size={16} />
          </span>

          <span className="flex-1">
            <span className="block font-medium">Create new sprint</span>
          </span>
        </button>

        <div className="my-1 h-px w-full bg-(--border)" />

        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-1 text-sm text-red-500 transition-all hover:bg-red-500/10"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
            <Trash size={16} />
          </span>

          <span className="flex-1 text-left">
            <span className="block font-medium">Delete project</span>
          </span>
        </button>
      </div>

      <AnimatePresence>
        {memberToAdd && (
          <motion.div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isAddingMember) setMemberToAdd(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
              className={`w-full max-w-md rounded-2xl border bg-(--surface) p-5 shadow-2xl ${classNames.border}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                  <UserPlus size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-(--text-primary)">
                        Add project member?
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-(--text-secondary)">
                        Add{" "}
                        <span className="font-medium text-(--text-primary)">
                          {memberToAddName}
                        </span>{" "}
                        to this project?
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isAddingMember}
                      onClick={() => setMemberToAdd(null)}
                      className="rounded-lg p-1 text-(--text-secondary) transition hover:bg-(--border) hover:text-(--text-primary) disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={isAddingMember}
                      onClick={() => setMemberToAdd(null)}
                      className="rounded-lg border border-(--border) px-4 py-2 text-sm font-medium text-(--text-primary) transition hover:bg-(--border) disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={isAddingMember}
                      onClick={handleConfirmAddMember}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isAddingMember && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      Add member
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {memberToRemove && (
          <motion.div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isRemovingMember) setMemberToRemove(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
              className={`w-full max-w-md rounded-2xl border bg-(--surface) p-5 shadow-2xl ${classNames.border}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                  <AlertTriangle size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-(--text-primary)">
                        {removeModalTitle}
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-(--text-secondary)">
                        {removeModalDescription}
                      </p>

                      {isRemovingYourself && (
                        <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs leading-5 text-red-500">
                          After leaving, this project may disappear from your
                          workspace/project list immediately.
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isRemovingMember}
                      onClick={() => setMemberToRemove(null)}
                      className="rounded-lg p-1 text-(--text-secondary) transition hover:bg-(--border) hover:text-(--text-primary) disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={isRemovingMember}
                      onClick={() => setMemberToRemove(null)}
                      className="rounded-lg border border-(--border) px-4 py-2 text-sm font-medium text-(--text-primary) transition hover:bg-(--border) disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={isRemovingMember}
                      onClick={handleConfirmRemoveMember}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isRemovingMember && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      {removeConfirmLabel}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MemberSkeleton() {
  return (
    <div className="space-y-1 px-1 py-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-lg px-3 py-2"
        >
          <div className="h-8 w-8 animate-pulse rounded-full bg-(--border)" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-28 animate-pulse rounded bg-(--border)" />
            <div className="h-2.5 w-20 animate-pulse rounded bg-(--border)" />
          </div>
        </div>
      ))}
    </div>
  );
}
