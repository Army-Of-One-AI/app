"use client";

import useWorkspaceDetailsBySlug from "@/features/workspaces/hooks/useWorkspaceDetailsBySlug";
import { classNames } from "@/shared/styles/classNames";
import {
  ChevronDown,
  FolderKanban,
  Inbox,
  Layers3,
  ListTodo,
  Moon,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import { useParams } from "next/navigation";
import Popover from "../Popover";
import { useState, useSyncExternalStore } from "react";
import UserPopoverContent from "./UserPopoverContent";
import useCurrentUserInfo from "@/features/auth/hooks/useCurrentUserInfo";
import Link from "next/link";

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
  {
    label: "Inbox",
    path: "/inbox",
    icon: <Inbox size={18} />,
  },
  {
    label: "Tasks",
    path: "/tasks",
    icon: <ListTodo size={18} />,
  },
  {
    label: "Projects",
    path: "/projects",
    icon: <FolderKanban size={18} />,
  },
  {
    label: "Views",
    path: "/views",
    icon: <Layers3 size={18} />,
  },
];

const managementItems: SidebarItem[] = [
  {
    label: "Teams",
    path: "/teams",
    icon: <Users size={18} />,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: <Settings size={18} />,
  },
];

export default function Sidebar() {
  const params = useParams();
  const slug = params.workspaceSlug as string;

  const [isOpenPopover, setOpenPopover] = useState(false);
  const theme = useSyncExternalStore(
    subscribeToThemeChange,
    getThemeSnapshot,
    () => "dark"
  );

  const { data, isLoading: isLoadingWorkspaceDetails } =
    useWorkspaceDetailsBySlug(slug);
  const { data: userInfo, isLoading: isLoadingUserInfo } = useCurrentUserInfo();
  const isLoading = isLoadingWorkspaceDetails || isLoadingUserInfo;

  const workspaceName = data?.name ?? "Workspace";
  const workspaceInitial = workspaceName.charAt(0).toUpperCase();

  const buildPath = (path: string) => `/${slug}${path}`;

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("theme", nextTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  return (
    <aside
      className={`
        absolute inset-y-0 left-0 w-60
        px-3 py-4
        ${classNames.text.primary}
      `}
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
          className="flex items-center gap-3 px-2 cursor-pointer"
        >
          <div
            className={`
            flex h-8 w-8 shrink-0 items-center justify-center
            rounded-full ${classNames.primary.bg}
            text-sm font-semibold ${classNames.primary.text}
            `}
          >
            {isLoading ? "..." : workspaceInitial}
          </div>

          <div className="flex min-w-0 items-center gap-1 font-semibold text-sm">
            <span className="truncate">
              {isLoading ? "Loading..." : workspaceName}
            </span>
            <ChevronDown size={14} className="shrink-0" />
          </div>
        </button>
      </Popover>

      <nav className="mt-6 flex flex-col gap-1">
        {workspaceItems.map((item) => (
          <Link
            key={item.path}
            href={buildPath(item.path)}
            className={`
              flex items-center gap-3 rounded-lg px-3 py-2 text-sm
              ${classNames.text.secondary}
              hover:bg-[var(--secondary)]
              hover:${classNames.text.primary}
            `}
          >
            <span className="shrink-0">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        <div
          className={`
            mb-2 px-3 text-xs font-semibold uppercase tracking-wide
            ${classNames.text.secondary}
          `}
        >
          Workspace
        </div>

        <nav className="flex flex-col gap-1">
          {managementItems.map((item) => (
            <Link
              key={item.path}
              href={buildPath(item.path)}
              className={`
                flex items-center gap-3 rounded-lg px-3 py-2 text-sm
                ${classNames.text.secondary}
                hover:bg-[var(--secondary)]
                hover:${classNames.text.primary}
              `}
            >
              <span className="shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-8">
        <div
          className={`
            mb-2 flex items-center gap-1 px-3 text-xs font-semibold uppercase tracking-wide
            ${classNames.text.secondary}
          `}
        >
          Your teams
          <ChevronDown size={12} />
        </div>

        <div className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2">
          <div className="h-4 w-4 rounded bg-[var(--primary)]" />
          <span className="truncate text-sm font-medium">{workspaceName}</span>
          <ChevronDown size={12} className={classNames.text.secondary} />
        </div>

        <nav className="flex flex-col gap-1">
          {[
            {
              label: "Issues",
              path: "/issues",
              icon: <ListTodo size={18} />,
            },
            {
              label: "Projects",
              path: "/team-projects",
              icon: <FolderKanban size={18} />,
            },
            {
              label: "Views",
              path: "/team-views",
              icon: <Layers3 size={18} />,
            },
          ].map((item) => (
            <Link
              key={item.path}
              href={buildPath(item.path)}
              className={`
                flex items-center gap-3 rounded-lg px-3 py-2 text-sm
                ${classNames.text.secondary}
                hover:bg-[var(--secondary)]
                hover:${classNames.text.primary}
              `}
            >
              <span className="shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={
          theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
        }
        title={
          theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
        }
        className={`
          mt-8 flex h-9 w-9 items-center justify-center rounded-lg border
          ${classNames.border}
          ${classNames.text.secondary}
          hover:bg-[var(--secondary)]
          hover:text-[var(--text-primary)]
        `}
      >
        {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
      </button>
    </aside>
  );
}
