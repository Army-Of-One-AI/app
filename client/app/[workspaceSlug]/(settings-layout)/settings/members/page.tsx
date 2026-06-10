"use client";

import InviteMembersModal from "./components/InviteMembersModal";
import useCurrentUserWorkspacePermissions from "@/features/auth/hooks/useCurrentUserWorkspacePermissions";
import useUpdateWorkspaceMemberRole from "@/features/workspaces/hooks/useUpdateWorkspaceMemberRole";
import useWorkspaceInvites from "@/features/workspaces/hooks/useWorkspaceInvites";
import useWorkspaceMembers from "@/features/workspaces/hooks/useWorkspaceMembers";
// import useRevokeWorkspaceInvite from "@/features/workspaces/hooks/useRevokeWorkspaceInvite";
import { WorkspaceInvite } from "@/features/workspaces/types";
import useModal from "@/shared/hooks/useModal";
import useSlugs from "@/shared/hooks/useSlugs";
import { classNames } from "@/shared/styles/classNames";
import { WorkspaceRole } from "@/shared/types/enums";
import Button from "@/shared/ui/Button";
import SearchBar from "@/shared/ui/SearchBar";
import Select from "@/shared/ui/Select";
import DataTable from "@/shared/ui/Table";
import { formatDate } from "@/shared/utils/helpers";
import { Clock3, Mail, Plus, RotateCcw, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

const ALL_VALUE = "__all__";

type InviteStatus = "Pending" | "Accepted" | "Revoked" | "Expired";

const roleLabels: Record<WorkspaceRole, string> = {
  [WorkspaceRole.Owner]: "Owner",
  [WorkspaceRole.Admin]: "Admin",
  [WorkspaceRole.Member]: "Member",
};

const roleStyles: Record<WorkspaceRole, string> = {
  [WorkspaceRole.Owner]: "bg-purple-500/10 text-purple-600",
  [WorkspaceRole.Admin]: "bg-blue-500/10 text-blue-600",
  [WorkspaceRole.Member]: "bg-(--border) text-(--text-secondary)",
};

const editableRoleOptions = [WorkspaceRole.Admin, WorkspaceRole.Member];

const inviteStatusStyles: Record<InviteStatus, string> = {
  Pending: "bg-amber-500/10 text-amber-600",
  Accepted: "bg-emerald-500/10 text-emerald-600",
  Revoked: "bg-red-500/10 text-red-600",
  Expired: "bg-(--border) text-(--text-secondary)",
};

function getInitials(name?: string | null, email?: string) {
  const value = name?.trim() || email || "?";

  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getInviteStatus(invite: WorkspaceInvite): InviteStatus {
  if (invite.acceptedAt) return "Accepted";
  if (invite.revokedAt) return "Revoked";

  if (new Date(invite.expiresAt).getTime() < Date.now()) {
    return "Expired";
  }

  return "Pending";
}

function getCreatorName(invite: WorkspaceInvite) {
  return invite.creator.fullName || invite.creator.email;
}

export default function SettingsMembersPage() {
  const { openModal } = useModal();
  const slugs = useSlugs();

  const [selectedRole, setSelectedRole] = useState<WorkspaceRole | undefined>();
  const [searchText, setSearchText] = useState("");

  const workspaceMembers = useWorkspaceMembers(slugs.workspace.slug);
  const {
    data: currentUserWorkspacePermissions,
    isLoading: isLoadingPermissions,
  } =
    useCurrentUserWorkspacePermissions(slugs.workspace.slug);
  const canManageMembers =
    currentUserWorkspacePermissions?.workspacePermissions.member.canManage ??
    false;
  const workspaceInvites = useWorkspaceInvites(slugs.workspace.slug, {
    enabled: !isLoadingPermissions && canManageMembers,
  });
  const {
    mutate: updateMemberRole,
    isPending: isUpdatingMemberRole,
    variables: updatingMemberRoleVariables,
  } = useUpdateWorkspaceMemberRole();

  // const { mutate: revokeInvite, isPending: isRevoking } =
  //   useRevokeWorkspaceInvite();

  const members = useMemo(
    () => workspaceMembers.data ?? [],
    [workspaceMembers.data]
  );
  const invites = useMemo(
    () => (workspaceInvites.data ?? []) as WorkspaceInvite[],
    [workspaceInvites.data]
  );

  const filteredMembers = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    const hasRoleFilter = selectedRole !== undefined;

    if (!keyword && !hasRoleFilter) return members;

    return members.filter((member) => {
      const matchesSearch =
        !keyword ||
        member.fullName?.toLowerCase().includes(keyword) ||
        member.email.toLowerCase().includes(keyword) ||
        member.username?.toLowerCase().includes(keyword);

      const matchesRole = !hasRoleFilter || member.role === selectedRole;

      return matchesSearch && matchesRole;
    });
  }, [members, searchText, selectedRole]);

  const pendingInvitesCount = useMemo(() => {
    return invites.filter((invite) => getInviteStatus(invite) === "Pending")
      .length;
  }, [invites]);

  const openInviteModal = () => {
    openModal({
      title: "Invite members",
      modalContent: (
        <InviteMembersModal refetchInvitations={workspaceInvites.refetch} />
      ),
    });
  };

  const handleRevokeInvite = () => {
    // revokeInvite({
    //   workspaceSlug: slugs.workspace.slug,
    //   inviteId: invite.id,
    // });
  };

  const handleUpdateMemberRole = (
    memberId: string,
    currentRole: WorkspaceRole,
    nextRole: string | number | undefined
  ) => {
    if (
      !canManageMembers ||
      currentRole === WorkspaceRole.Owner ||
      !nextRole ||
      nextRole === currentRole ||
      nextRole === WorkspaceRole.Owner
    ) {
      return;
    }

    updateMemberRole({
      workspaceSlug: slugs.workspace.slug,
      memberId,
      role: nextRole as WorkspaceRole,
    });
  };

  return (
    <main className="w-full px-10 py-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-(--text-primary)">
            Members
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-(--text-secondary)">
            Manage workspace access, review member roles, and keep track of
            pending invitations.
          </p>
        </div>

        {canManageMembers && (
          <Button onClick={openInviteModal} className="shrink-0 px-5">
            <span className="inline-flex items-center gap-2">
              <Plus size={16} />
              Invite
            </span>
          </Button>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <SearchBar
          className="w-full sm:w-[360px]!"
          value={searchText}
          onChange={setSearchText}
        />

        <Select
          className="w-full sm:w-[200px]"
          allOptionLabel="All roles"
          showAllOption
          selectedValue={selectedRole}
          items={Object.values(WorkspaceRole).map((value) => ({
            label: roleLabels[value],
            value,
          }))}
          onItemClicked={(value) => {
            setSelectedRole(
              value === ALL_VALUE ? undefined : (value as WorkspaceRole)
            );
          }}
        />
      </div>

      <section
        className={`mt-6 overflow-visible rounded-2xl border bg-(--card) ${classNames.border}`}
      >
        <DataTable
          isLoading={workspaceMembers.isLoading}
          skeletonRows={5}
          getRowKey={(row) => row.id}
          data={filteredMembers}
          columns={[
            {
              field: "fullName",
              label: "Member",
              render: (member) => (
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-(--border) text-sm font-semibold text-(--text-primary)">
                    {getInitials(member.fullName, member.email)}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate font-medium text-(--text-primary)">
                      {member.fullName || "Unnamed member"}
                    </div>

                    <div className="truncate text-sm text-(--text-secondary)">
                      {member.username ? `@${member.username}` : "No username"}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              field: "email",
              label: "Email",
              render: (member) => (
                <div className="flex items-center gap-2 text-(--text-secondary)">
                  <Mail size={15} />
                  <span className="truncate">{member.email}</span>
                </div>
              ),
            },
            {
              field: "role",
              label: "Role",
              render: (member) => {
                const canEditRole =
                  canManageMembers && member.role !== WorkspaceRole.Owner;
                const isUpdatingThisMember =
                  isUpdatingMemberRole &&
                  updatingMemberRoleVariables?.memberId === member.id;

                if (canEditRole) {
                  return (
                    <Select
                      className="w-[150px]"
                      selectedValue={member.role}
                      disabled={isUpdatingThisMember}
                      items={editableRoleOptions.map((value) => ({
                        label: roleLabels[value],
                        value,
                      }))}
                      onItemClicked={(value) =>
                        handleUpdateMemberRole(member.id, member.role, value)
                      }
                    />
                  );
                }

                return (
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                      roleStyles[member.role]
                    }`}
                  >
                    {roleLabels[member.role]}
                  </span>
                );
              },
            },
            {
              field: "teamsCount",
              label: "Teams",
              render: (member) => (
                <span className="text-(--text-secondary)">
                  {member.teamsCount ?? 0}
                </span>
              ),
            },
            {
              field: "joinedAt",
              label: "Joined",
              render: (member) => (
                <span className="text-(--text-secondary)">
                  {formatDate(member.joinedAt)}
                </span>
              ),
            },
          ]}
        />
      </section>

      {canManageMembers ? (
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-(--text-primary)">
                Invitations
              </h2>

              <p className="mt-1 text-sm text-(--text-secondary)">
                View pending, accepted, expired, and revoked workspace invites.
              </p>
            </div>

            <span className="rounded-full bg-(--border) px-3 py-1 text-xs font-medium text-(--text-secondary)">
              {pendingInvitesCount} pending
            </span>
          </div>

          <div
            className={`overflow-hidden rounded-2xl border bg-(--card) ${classNames.border}`}
          >
            <DataTable
              isLoading={workspaceInvites.isLoading}
              skeletonRows={3}
              getRowKey={(row) => row.id}
              data={invites}
              columns={[
              {
                field: "email",
                label: "Invitee",
                render: (invite) => (
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--border) text-xs font-semibold text-(--text-primary)">
                      {getInitials(null, invite.email)}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate font-medium text-(--text-primary)">
                        {invite.email}
                      </div>

                      <div className="truncate text-sm text-(--text-secondary)">
                        Invited by {getCreatorName(invite)}
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                field: "revokedAt",
                label: "Status",
                render: (invite) => {
                  const status = getInviteStatus(invite);

                  return (
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${inviteStatusStyles[status]}`}
                    >
                      {status}
                    </span>
                  );
                },
              },
              {
                field: "createdAt",
                label: "Created",
                render: (invite) => (
                  <span className="text-(--text-secondary)">
                    {formatDate(invite.createdAt)}
                  </span>
                ),
              },
              {
                field: "expiresAt",
                label: "Expires",
                render: (invite) => (
                  <div className="flex items-center gap-2 text-(--text-secondary)">
                    <Clock3 size={15} />
                    <span>{formatDate(invite.expiresAt)}</span>
                  </div>
                ),
              },
              {
                field: "creator",
                label: "Inviter",
                render: (invite) => (
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--border) text-xs font-semibold text-(--text-primary)">
                      {getInitials(
                        invite.creator.fullName,
                        invite.creator.email
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate font-medium text-(--text-primary)">
                        {getCreatorName(invite)}
                      </div>

                      <div className="truncate text-sm text-(--text-secondary)">
                        {invite.creator.email}
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                field: "id",
                label: "",
                render: (invite) => {
                  const status = getInviteStatus(invite);
                  const canRevoke = canManageMembers && status === "Pending";

                  return (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={!canRevoke}
                        onClick={handleRevokeInvite}
                        className="
                          inline-flex items-center gap-2 rounded-lg px-3 py-1.5
                          text-sm font-medium text-(--danger) transition
                          hover:bg-(--danger)/10
                          disabled:pointer-events-none disabled:opacity-40
                        "
                      >
                        {canRevoke ? (
                          <>
                            <RotateCcw size={14} />
                            Revoke
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={14} />
                            Locked
                          </>
                        )}
                      </button>
                    </div>
                  );
                },
              },
              ]}
            />
          </div>
        </section>
      ) : (
        <section
          className={`mt-10 rounded-2xl border bg-(--card) px-5 py-6 ${classNames.border}`}
        >
          <h2 className="text-base font-semibold text-(--text-primary)">
            Invitations
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-(--text-secondary)">
            Workspace invitations are only visible to owners and admins.
          </p>
        </section>
      )}
    </main>
  );
}
