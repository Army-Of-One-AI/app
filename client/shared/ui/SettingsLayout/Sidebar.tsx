"use client";

import useWorkspaceDetailsBySlug from "@/features/workspaces/hooks/useWorkspaceDetailsBySlug";
import useCurrentUserInfo from "@/features/auth/hooks/useCurrentUserInfo";
import useSlugs from "@/shared/hooks/useSlugs";
import { classNames } from "@/shared/styles/classNames";
import {
  ArrowLeft,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  CreditCard,
  FolderKanban,
  Inbox,
  Layers3,
  ListTodo,
  Moon,
  Palette,
  Settings,
  Shield,
  Sun,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

type SidebarItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
};

type ThemeMode = "dark" | "light";

const THEME_CHANGE_EVENT = "app-theme-change";

function getThemeSnapshot(): ThemeMode {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribeToThemeChange(onStoreChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
}

const workspaceItems: SidebarItem[] = [
  { label: "Inbox", path: "/inbox", icon: <Inbox size={18} /> },
  { label: "Tasks", path: "/tasks", icon: <ListTodo size={18} /> },
  { label: "Projects", path: "/projects", icon: <FolderKanban size={18} /> },
  { label: "Views", path: "/views", icon: <Layers3 size={18} /> },
];

const managementItems: SidebarItem[] = [
  { label: "Teams", path: "/teams", icon: <Users size={18} /> },
  { label: "Settings", path: "/settings", icon: <Settings size={18} /> },
];

const settingsItems: SidebarItem[] = [
  { label: "Profile", path: "/settings/profile", icon: <User size={18} /> },
  {
    label: "Workspace",
    path: "/settings/workspace",
    icon: <BriefcaseBusiness size={18} />,
  },
  { label: "Members", path: "/settings/members", icon: <Users size={18} /> },
  { label: "Security", path: "/settings/security", icon: <Shield size={18} /> },
  {
    label: "Notifications",
    path: "/settings/notifications",
    icon: <Bell size={18} />,
  },
  {
    label: "Appearance",
    path: "/settings/appearance",
    icon: <Palette size={18} />,
  },
  {
    label: "Billing",
    path: "/settings/billing",
    icon: <CreditCard size={18} />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { workspace } = useSlugs();
  const slug = workspace.slug;

  const theme = useSyncExternalStore(
    subscribeToThemeChange,
    getThemeSnapshot,
    () => "dark"
  );

  const { data } = useWorkspaceDetailsBySlug(slug);
  const { data: userInfo } = useCurrentUserInfo();

  const workspaceName = data?.name ?? "Workspace";
  const workspaceInitial = workspaceName.charAt(0).toUpperCase();

  const buildPath = (path: string) => `/${slug}${path}`;
  const isSettingsPage = pathname.startsWith(`/${slug}/settings`);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("theme", nextTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  const isActive = (path: string) => {
    const fullPath = buildPath(path);

    if (path === "/settings") {
      return pathname === fullPath;
    }

    return pathname === fullPath || pathname.startsWith(`${fullPath}/`);
  };

  const itemClassName = (path: string) => `
    flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition
    ${
      isActive(path)
        ? "bg-[var(--secondary)] text-[var(--foreground)]"
        : `${classNames.text.secondary} hover:bg-[var(--secondary)] hover:text-[var(--foreground)]`
    }
  `;

  return (
    <aside
      className={`
          absolute inset-y-0 left-0 w-64 border-r border-[var(--border)] px-3
          ${classNames.text.primary}
        `}
    >
      <div className="mt-4">
        <Link
          href={buildPath("/projects")}
          className={`
              mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition
              ${classNames.text.secondary}
              hover:bg-[var(--secondary)] hover:text-[var(--foreground)]
            `}
        >
          <ArrowLeft size={16} />
          Back to workspace
        </Link>

        <div className="mb-5 rounded-xl bg-[var(--card)] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-sm font-semibold text-white">
              {workspaceInitial}
            </div>

            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {workspaceName}
              </div>
              <div className={`truncate text-xs ${classNames.text.secondary}`}>
                Workspace settings
              </div>
            </div>
          </div>
        </div>

        <div
          className={`
              mb-2 px-3 text-xs font-semibold uppercase tracking-wide
              ${classNames.text.secondary}
            `}
        >
          Settings
        </div>

        <nav className="flex flex-col gap-1 pr-4">
          {settingsItems.map((item) => (
            <Link
              key={item.path}
              href={buildPath(item.path)}
              className={itemClassName(item.path)}
            >
              <span className="shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="absolute bottom-4 left-3 right-3">
        <button
          type="button"
          onClick={toggleTheme}
          className={`
              flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition
              ${classNames.text.secondary}
              hover:bg-[var(--secondary)] hover:text-[var(--foreground)]
            `}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>
      </div>
    </aside>
  );
}
