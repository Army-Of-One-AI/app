"use client";

import { apiClient } from "@/shared/api/apiClient";

export default function LoginPage() {
  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  return (
    <div>
      <button onClick={handleGoogleLogin}>Continue with Google</button>
    </div>
  );
}
