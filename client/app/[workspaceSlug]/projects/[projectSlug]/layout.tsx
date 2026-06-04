"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useParams, usePathname } from "next/navigation";

import PageContent from "@/shared/ui/DashboardLayout/PageContent";

const projectNavItems = [
  {
    label: "Overview",
    href: "",
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

  const params = useParams();
  const projectSlug = params.projectSlug as string;
  const workspaceSlug = params.workspaceSlug as string;

  const projectBaseUrl = `/${workspaceSlug}/projects/${projectSlug}`;

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
  }, [pathname, projectSlug, projectBaseUrl]);

  return (
    <PageContent title="Project Details" customHeader={customHeader}>
      {children}
    </PageContent>
  );
}
