"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ElementType } from "react";
import { useState } from "react";
import {
  BarChart3,
  ChevronDown,
  FileText,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  ListTodo,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";

import useCurrentUserInfo from "@/features/auth/hooks/useCurrentUserInfo";
import useWorkspaceDetailsBySlug from "@/features/workspaces/hooks/useWorkspaceDetailsBySlug";
import useSlugs from "@/shared/hooks/useSlugs";
import { classNames } from "@/shared/styles/classNames";
import Popover from "../Popover";
import UserPopoverContent from "./UserPopoverContent";

type SidebarItem = {
  label: string;
  path: string;
  icon: ElementType;
  exact?: boolean;
};

const workspaceItems: SidebarItem[] = [
  {
    label: "Inbox",
    path: "/inbox",
    icon: Inbox,
  },
  {
    label: "Projects",
    path: "/projects",
    icon: FolderKanban,
    exact: false,
  },
];

const settingsItems: SidebarItem[] = [
  {
    label: "Profile",
    path: "/settings/profile",
    icon: Settings,
  },
  {
    label: "Members",
    path: "/settings/members",
    icon: Users,
  },
  {
    label: "Workspace",
    path: "/settings/workspace",
    icon: LayoutDashboard,
  },
];

const projectItems: SidebarItem[] = [
  {
    label: "Overview",
    path: "",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Summary",
    path: "/summary",
    icon: BarChart3,
  },
  {
    label: "Board",
    path: "/board",
    icon: ListTodo,
  },
  {
    label: "Epics",
    path: "/epics",
    icon: Sparkles,
  },
  {
    label: "Documents",
    path: "/documents",
    icon: FileText,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { workspace, project } = useSlugs();
  const workspaceSlug = workspace.slug;
  const projectSlug = project.slug;

  const [isOpenPopover, setOpenPopover] = useState(false);

  const { data: workspaceDetails, isLoading: isLoadingWorkspaceDetails } =
    useWorkspaceDetailsBySlug(workspaceSlug);
  const { data: userInfo, isLoading: isLoadingUserInfo } = useCurrentUserInfo();
  const isLoading = isLoadingWorkspaceDetails || isLoadingUserInfo;

  const workspaceName = workspaceDetails?.name ?? "Workspace";
  const workspaceInitial = getInitials(workspaceName);
  const userName = userInfo?.fullName || userInfo?.username || userInfo?.email;
  const projectBasePath =
    workspaceSlug && projectSlug
      ? `/${workspaceSlug}/projects/${projectSlug}`
      : "";

  const buildWorkspacePath = (path: string) => `/${workspaceSlug}${path}`;

  return (
    <aside
      className={`absolute inset-y-0 left-0 flex w-64 flex-col px-3 py-4 ${classNames.text.primary}`}
    >
      <Popover
        isOpen={isOpenPopover}
        position="right"
        onClose={() => setOpenPopover(false)}
        content={<UserPopoverContent userInfo={userInfo} />}
      >
        <button
          type="button"
          onClick={() => setOpenPopover((curr) => !curr)}
          className="group flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 text-left shadow-[var(--shadow-soft)] transition hover:bg-[var(--secondary)]"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-semibold text-[var(--on-primary)]">
            {isLoading ? "..." : workspaceInitial}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
              {isLoading ? "Loading..." : workspaceName}
            </p>
            <p className="truncate text-xs text-[var(--text-secondary)]">
              {userName || "Account"}
            </p>
          </div>

          <ChevronDown
            size={16}
            className="shrink-0 text-[var(--text-secondary)] transition group-hover:text-[var(--text-primary)]"
          />
        </button>
      </Popover>

      <nav className="mt-5 space-y-1">
        {workspaceItems.map((item) => (
          <SidebarLink
            key={item.path}
            href={buildWorkspacePath(item.path)}
            icon={item.icon}
            label={item.label}
            active={isActivePath(pathname, buildWorkspacePath(item.path), item.exact)}
          />
        ))}
      </nav>

      {projectBasePath && (
        <section className="mt-6">
          <SectionLabel label="Current project" />
          <nav className="space-y-1">
            {projectItems.map((item) => {
              const href = `${projectBasePath}${item.path}`;

              return (
                <SidebarLink
                  key={item.label}
                  href={href}
                  icon={item.icon}
                  label={item.label}
                  active={isActivePath(pathname, href, item.exact)}
                  compact
                />
              );
            })}
          </nav>
        </section>
      )}

      <section className="mt-6">
        <SectionLabel label="Workspace" />
        <nav className="space-y-1">
          {settingsItems.map((item) => (
            <SidebarLink
              key={item.path}
              href={buildWorkspacePath(item.path)}
              icon={item.icon}
              label={item.label}
              active={isActivePath(pathname, buildWorkspacePath(item.path), item.exact)}
            />
          ))}
        </nav>
      </section>

      <div className="mt-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-3">
          <UserAvatar userInfo={userInfo} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[var(--text-primary)]">
              {userName || "Signed in"}
            </p>
            <p className="truncate text-xs text-[var(--text-secondary)]">
              {userInfo?.email ?? "Workspace member"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
  compact = false,
}: {
  href: string;
  icon: ElementType;
  label: string;
  active: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
        compact ? "py-2" : "py-2.5"
      } ${
        active
          ? "bg-[var(--secondary)] text-[var(--text-primary)] shadow-xs"
          : "text-[var(--text-secondary)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]"
      }`}
    >
      <span
        className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${
          active
            ? "bg-[var(--surface)] text-[var(--primary)]"
            : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
        }`}
      >
        <Icon size={16} />
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
      {label}
    </div>
  );
}

function UserAvatar({
  userInfo,
}: {
  userInfo?: {
    avatarImageURL?: string | null;
    fullName?: string | null;
    username?: string | null;
    email?: string | null;
  };
}) {
  const name = userInfo?.fullName || userInfo?.username || userInfo?.email || "";

  if (userInfo?.avatarImageURL) {
    return (
      <div
        aria-label={name}
        className="size-9 rounded-full bg-cover bg-center"
        role="img"
        style={{
          backgroundImage: `url("${userInfo.avatarImageURL}")`,
        }}
      />
    );
  }

  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)] text-xs font-semibold text-[var(--text-secondary)]">
      {getInitials(name || "User")}
    </div>
  );
}

function isActivePath(pathname: string, href: string, exact = false) {
  if (exact) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return initials || "?";
}
