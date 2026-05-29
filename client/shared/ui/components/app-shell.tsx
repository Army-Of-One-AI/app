"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import {
  Cpu,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Route,
  Search,
  Settings,
  SidebarClose,
  UsersRound,
} from "lucide-react";
import { Button } from "./button";

type ViewMode = "Board" | "Pipeline" | "Core Team" | "Documents";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Workspaces", href: "/workspaces", icon: FolderKanban },
  { label: "Model Providers", href: "/settings/model-providers", icon: Cpu },
  { label: "Settings", href: "/settings", icon: Settings },
] satisfies Array<{ label: string; href: string; icon: ComponentType<{ className?: string }> }>;

const projectContextItems = [
  { label: "Board", view: "board", icon: FolderKanban },
  { label: "Pipeline", view: "pipeline", icon: Route },
  { label: "Core Team", view: "core-team", icon: UsersRound },
  { label: "Documents", view: "documents", icon: FileText },
] satisfies Array<{ label: ViewMode; view: string; icon: ComponentType<{ className?: string }> }>;

const viewParamFromMode: Record<ViewMode, string> = {
  Board: "board",
  Pipeline: "pipeline",
  "Core Team": "core-team",
  Documents: "documents",
};

export function AppShell({
  title,
  eyebrow,
  workspaceId,
  currentProjectId,
  viewMode,
  onViewModeChange,
  action,
  inspector,
  bottomBar,
  children,
}: {
  title: string;
  eyebrow?: string;
  workspaceId?: string;
  currentProjectId?: string;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  action?: ReactNode;
  inspector?: ReactNode;
  bottomBar?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const modes: ViewMode[] = ["Board", "Pipeline", "Core Team", "Documents"];
  const currentView = viewMode ? viewParamFromMode[viewMode] : "board";

  return (
    <div className="flex h-screen gap-3 bg-[#F7F8FC] p-3 text-[#111827]">
      <aside className="flex h-full w-56 shrink-0 flex-col rounded-2xl border border-[#E5E7EB] bg-[#EEF2FF] shadow-sm">
        <div className="flex h-16 items-center gap-3 border-b border-[#E5E7EB] px-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#4F46E5] text-sm font-bold text-white shadow-sm">
            A1
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#111827]">Army of One</p>
            <p className="truncate text-xs text-[#6B7280]">AI workspace</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-3">
          {navItems.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : item.href === "/settings"
                  ? pathname === "/settings"
                  : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                title={item.label}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-white text-[#4F46E5] shadow-sm" : "text-[#6B7280] hover:bg-white hover:text-[#4F46E5]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
          {currentProjectId ? (
            <>
              <div className="my-2 h-px bg-[#E5E7EB]" />
              <p className="px-3 text-[11px] font-semibold uppercase tracking-normal text-[#6B7280]">Current project</p>
              {projectContextItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === `/projects/${currentProjectId}` && currentView === item.view;
                return (
                  <Link
                    key={item.view}
                    href={`/projects/${currentProjectId}?view=${item.view}`}
                    title={item.label}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      active ? "bg-white text-[#4F46E5] shadow-sm" : "text-[#6B7280] hover:bg-white hover:text-[#4F46E5]"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </>
          ) : null}
        </nav>
        <div className="grid gap-1.5 border-t border-[#E5E7EB] p-3">
          <button className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#6B7280] hover:bg-white" title="Search">
            <Search className="h-4 w-4 shrink-0" />
            <span>Search</span>
          </button>
          <button className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#6B7280] hover:bg-white" title="Collapse">
            <SidebarClose className="h-4 w-4 shrink-0" />
            <span>Collapse</span>
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 gap-3">
        <section className="grid min-w-0 flex-1 grid-rows-[auto_1fr_auto] overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          <header className="z-20 flex min-h-16 items-center justify-between gap-4 border-b border-[#E5E7EB] bg-white/95 px-4 backdrop-blur">
            <div className="flex min-w-0 items-center gap-3">
              <Button variant="ghost" className="h-9 min-h-9 w-9 px-0" onClick={() => router.back()}>
                ←
              </Button>
              <div className="min-w-0">
                {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-normal text-[#6B7280]">{eyebrow}</p> : null}
                <h1 className="truncate text-base font-semibold text-[#111827]">{title}</h1>
              </div>
              {viewMode && onViewModeChange ? (
                <div className="ml-2 hidden rounded-xl border border-[#E5E7EB] bg-[#F7F8FC] p-1 md:flex">
                  {modes.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onViewModeChange(mode)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        viewMode === mode ? "bg-white text-[#4F46E5] shadow-sm" : "text-[#6B7280] hover:text-[#111827]"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#22C55E] sm:inline-flex">
                Synced
              </span>
              <Button variant="ghost" className="h-9 min-h-9 w-9 px-0" title="Search">
                ⌕
              </Button>
              {action}
            </div>
          </header>
          <div className="min-h-0 min-w-0 overflow-hidden bg-[#F7F8FC] p-2">
            <div className="h-full min-h-0 overflow-auto rounded-2xl border border-[#E5E7EB] bg-white p-4">
              {children}
            </div>
          </div>
          <footer className="border-t border-[#E5E7EB] bg-white px-4 py-2">{bottomBar ?? <WorkspaceStatusBar />}</footer>
        </section>
        {inspector ? (
          <aside className="hidden h-full w-[420px] shrink-0 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm xl:block">
            {inspector}
          </aside>
        ) : null}
      </main>
    </div>
  );
}

function WorkspaceStatusBar() {
  return (
    <div className="flex items-center justify-between gap-3 text-xs text-[#6B7280]">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
          API ready
        </span>
        <span>Recent runs: core team execution only</span>
      </div>
      <span className="hidden sm:inline">Board, pipeline, core team, documents</span>
    </div>
  );
}
