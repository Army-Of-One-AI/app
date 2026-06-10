"use client";

import useCurrentUserWorkspacePermissions from "@/features/auth/hooks/useCurrentUserWorkspacePermissions";
import useSlugs from "@/shared/hooks/useSlugs";
import DashboardLayout from "@/shared/ui/DashboardLayout/DashboardLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  const slugs = useSlugs();
  useCurrentUserWorkspacePermissions(slugs.workspace.slug);

  return <DashboardLayout>{children}</DashboardLayout>;
}
