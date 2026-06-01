"use client";

import useAuthentication from "@/features/auth/hooks/useAuthentication";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthentication();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return null;
  }

  return <div>Onboarding</div>;
}
