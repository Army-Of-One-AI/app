"use client";

import useAuthentication from "@/features/auth/hooks/useAuthentication";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const router = useRouter();
  const { userInfo, isAuthenticated, isLoading } = useAuthentication();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (userInfo!.workspaces.length > 0) {
      if (userInfo?.lastUsedWorkspaceId) {
        const workspace = userInfo.workspaces.find(
          (ele) => ele.id === userInfo.lastUsedWorkspaceId
        );

        if (workspace) {
          router.push(`/${workspace.slug}/projects`);
          return;
        }

        router.push(`/${userInfo!.workspaces[0].slug}/projects`);
      }
    } else {
      router.push(`/onboarding`);
    }
  }, [userInfo, isAuthenticated, router, isLoading]);

  if (isLoading) {
    return null;
  }

  return null;
}
