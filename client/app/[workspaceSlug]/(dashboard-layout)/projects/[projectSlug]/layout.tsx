/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Ellipsis } from "lucide-react";
import { usePathname } from "next/navigation";

import PageContent from "@/shared/ui/DashboardLayout/PageContent";
import useSlugs from "@/shared/hooks/useSlugs";
import Popover from "@/shared/ui/Popover";
import ProjectActions from "./components/ProjectActions";

const projectNavItems = [
  {
    label: "Overview",
    href: "",
  },
  {
    label: "Summary",
    href: "/summary",
  },
  {
    label: "Board",
    href: "/board",
  },
  {
    label: "Documents",
    href: "/documents",
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const { workspace, project } = useSlugs();
  const workspaceSlug = workspace.slug;
  const projectSlug = project.slug;

  const projectBaseUrl = `/${workspaceSlug}/projects/${projectSlug}`;

  const [isOpenPopover, setOpenPopover] = useState(false);

  const customHeader = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const currentPage = segments[3];

    return (
      <div className="flex flex-col gap-3">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm px-4">
          {!currentPage ? (
            <>
              <Link
                href={`/${workspaceSlug}/projects`}
                className="font-medium hover:underline"
              >
                Projects
              </Link>

              <ChevronRight size={14} />

              <span className="font-medium">{projectSlug}</span>
            </>
          ) : (
            <>
              <Link
                href={`/${workspaceSlug}/projects`}
                className="font-medium hover:underline"
              >
                Projects
              </Link>

              <ChevronRight size={14} />

              <Link
                href={projectBaseUrl}
                className="font-medium hover:underline"
              >
                {projectSlug}
              </Link>

              <ChevronRight size={14} />

              <span className="font-medium capitalize">
                {currentPage.replace(/-/g, " ")}
              </span>
            </>
          )}

          <Popover
            position="left"
            onClose={() => {
              setOpenPopover(false);
            }}
            isOpen={isOpenPopover}
            content={<ProjectActions />}
          >
            <button
              onClick={() => setOpenPopover((curr) => !curr)}
              className="h-full flex items-center px-2 cursor-pointer"
            >
              <Ellipsis size={16} />
            </button>
          </Popover>
        </div>

        <nav className="flex items-center gap-1 border-b border-[var(--border)] px-4 py-2">
          {projectNavItems.map((item) => {
            const href = `${projectBaseUrl}${item.href}`;

            const isActive =
              item.href === ""
                ? pathname === projectBaseUrl
                : pathname.startsWith(href);

            return (
              <Link
                key={item.label}
                href={href}
                className={`
                  relative px-3 py-2 text-sm font-medium transition-colors
                  ${
                    isActive
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }
                `}
              >
                {item.label}

                {isActive && (
                  <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[var(--primary)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    );
  }, [pathname, workspaceSlug, projectSlug, projectBaseUrl, isOpenPopover]);

  return (
    <PageContent title="Project Details" customHeader={customHeader}>
      {children}
    </PageContent>
  );
}
