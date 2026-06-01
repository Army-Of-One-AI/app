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
      router.push(`/${userInfo!.workspaces[0].slug}`);
    } else {
      router.push(`/onboarding`);
    }
  }, [userInfo, isAuthenticated, router, isLoading]);

  if (isLoading) {
    return null;
  }

  return null;
}
