"use client";

import useAddMemberToProject from "@/features/projects/hooks/useAddMemberToProject";
import useGetProjectDetailsBySlug from "@/features/projects/hooks/useGetProjectDetailsBySlug";
import useRemoveMemberFromProject from "@/features/projects/hooks/useRemoveMemberFromProject";
import useWorkspaceMembers from "@/features/workspaces/hooks/useWorkspaceMembers";
import useSlugs from "@/shared/hooks/useSlugs";
import { classNames } from "@/shared/styles/classNames";
import {
  Check,
  ChevronRight,
  Search,
  Trash,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";

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

export default function ProjectActions() {
  const slugs = useSlugs();

  const [isOpenAddMember, setOpenAddMember] = useState(false);
  const [search, setSearch] = useState("");

  const { data: projectDetails } = useGetProjectDetailsBySlug(
    slugs.project.slug,
    slugs.workspace.slug
  );

  const { mutateAsync: addMemberToProject, isPending: isAddingMember } = useAddMemberToProject();
  const { mutateAsync: removeMemberFromProject, isPending: isRemovingMember } = useRemoveMemberFromProject();

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

  return (
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
          className={`transition-transform ${isOpenAddMember ? "rotate-180" : "group-hover:translate-x-0.5"
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

                  <div>
                    <p className="text-sm font-semibold text-(--text-primary)">
                      Add project members
                    </p>
                  </div>
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

              <div className="max-h-[280px] overflow-y-auto p-1 ">
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
                    const name =
                      member.fullName || member.username || "Unnamed member";

                    return (
                      <div
                        key={member.id}
                        onClick={async () => {
                          if (!isAdded) {
                            await addMemberToProject({
                              workspaceSlug: slugs.workspace.slug,
                              projectSlug: slugs.project.slug,
                              targetUserId: member.id
                            })
                          } else {
                            await removeMemberFromProject({
                              workspaceSlug: slugs.workspace.slug,
                              projectSlug: slugs.project.slug,
                              targetUserId: member.id
                            })
                          }
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all hover:bg-(--border)"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--border) text-xs font-semibold text-(--text-primary)">
                          {name.slice(0, 1).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-(--text-primary)">
                            {name}
                          </p>
                          {member.email && (
                            <p className="truncate text-xs text-(--text-secondary)">
                              {member.email}
                            </p>
                          )}
                        </div>

                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${isAdded
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
  );
}
