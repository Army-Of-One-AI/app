"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ElementType } from "react";
import { useSyncExternalStore } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Moon,
  Settings,
  Sun,
  User,
  Users,
} from "lucide-react";

import useCurrentUserInfo from "@/features/auth/hooks/useCurrentUserInfo";
import useWorkspaceDetailsBySlug from "@/features/workspaces/hooks/useWorkspaceDetailsBySlug";
import useSlugs from "@/shared/hooks/useSlugs";
import { classNames } from "@/shared/styles/classNames";

type SidebarItem = {
  label: string;
  description: string;
  path: string;
  icon: ElementType;
};

type ThemeMode = "dark" | "light";

const THEME_CHANGE_EVENT = "app-theme-change";

const settingsItems: SidebarItem[] = [
  {
    label: "Profile",
    description: "Personal details",
    path: "/settings/profile",
    icon: User,
  },
  {
    label: "Members",
    description: "Invites and roles",
    path: "/settings/members",
    icon: Users,
  },
  {
    label: "Workspace",
    description: "Name, URL, danger zone",
    path: "/settings/workspace",
    icon: BriefcaseBusiness,
  },
];

function getThemeSnapshot(): ThemeMode {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribeToThemeChange(onStoreChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
}

export default function Sidebar() {
  const pathname = usePathname();
  const { workspace } = useSlugs();
  const workspaceSlug = workspace.slug;

  const theme = useSyncExternalStore(
    subscribeToThemeChange,
    getThemeSnapshot,
    () => "dark"
  );

  const { data: workspaceDetails, isLoading: isLoadingWorkspace } =
    useWorkspaceDetailsBySlug(workspaceSlug);
  const { data: userInfo, isLoading: isLoadingUser } = useCurrentUserInfo();
  const isLoading = isLoadingWorkspace || isLoadingUser;

  const workspaceName = workspaceDetails?.name ?? "Workspace";
  const workspaceInitial = getInitials(workspaceName);
  const userName = userInfo?.fullName || userInfo?.username || userInfo?.email;

  const buildPath = (path: string) => `/${workspaceSlug}${path}`;

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("theme", nextTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  return (
    <aside
      className={`flex h-[calc(100vh-24px)] w-64 shrink-0 flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 px-3 py-4 shadow-[var(--shadow-soft)] ${classNames.text.primary}`}
    >
      <Link
        href={buildPath("/projects")}
        className="group mb-4 inline-flex h-10 items-center gap-2 rounded-xl px-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft size={16} />
        Back to workspace
      </Link>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-semibold text-[var(--on-primary)]">
            {isLoading ? "..." : workspaceInitial}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
              {isLoading ? "Loading..." : workspaceName}
            </p>
            <p className="truncate text-xs text-[var(--text-secondary)]">
              Workspace settings
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-2 flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          <Settings size={13} />
          Settings
        </div>

        <nav className="space-y-1">
          {settingsItems.map((item) => (
            <SettingsLink
              key={item.path}
              href={buildPath(item.path)}
              icon={item.icon}
              label={item.label}
              description={item.description}
              active={isActivePath(pathname, buildPath(item.path))}
            />
          ))}
        </nav>
      </section>

      <section className="mt-auto space-y-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary)]">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-[var(--text-primary)]">
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </span>
            <span className="block truncate text-xs text-[var(--text-secondary)]">
              Switch appearance
            </span>
          </span>
        </button>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
          <div className="flex items-center gap-3">
            <UserAvatar
              avatarURL={userInfo?.avatarImageURL}
              name={userName || "User"}
            />
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
      </section>
    </aside>
  );
}

function SettingsLink({
  href,
  icon: Icon,
  label,
  description,
  active,
}: {
  href: string;
  icon: ElementType;
  label: string;
  description: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
        active
          ? "bg-[var(--secondary)] text-[var(--text-primary)] shadow-xs"
          : "text-[var(--text-secondary)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]"
      }`}
    >
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
          active
            ? "bg-[var(--surface)] text-[var(--primary)]"
            : "bg-[var(--surface)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
        }`}
      >
        <Icon size={17} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{label}</span>
        <span className="block truncate text-xs text-[var(--text-secondary)]">
          {description}
        </span>
      </span>

      {active ? (
        <CheckCircle2 size={15} className="shrink-0 text-[var(--primary)]" />
      ) : (
        <ChevronRight
          size={15}
          className="shrink-0 text-[var(--text-secondary)] opacity-0 transition group-hover:opacity-100"
        />
      )}
    </Link>
  );
}

function UserAvatar({
  avatarURL,
  name,
}: {
  avatarURL?: string | null;
  name: string;
}) {
  if (avatarURL) {
    return (
      <div
        aria-label={name}
        className="size-9 shrink-0 rounded-full bg-cover bg-center"
        role="img"
        style={{
          backgroundImage: `url("${avatarURL}")`,
        }}
      />
    );
  }

  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)] text-xs font-semibold text-[var(--text-secondary)]">
      {getInitials(name)}
    </div>
  );
}

function isActivePath(pathname: string, href: string) {
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
