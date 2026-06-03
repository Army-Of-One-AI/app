"use client";

import { classNames } from "@/shared/styles/classNames";
import { motion } from "motion/react";

export default function LoginPage() {
  const handleGoogleLogin = () => {
    window.location.assign(`${process.env.NEXT_PUBLIC_API_URL}/auth/google`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 1,
      }}
      className={`relative flex min-h-screen items-center justify-center overflow-hidden px-6 ${classNames.background}`}
    >
      <motion.div
        initial={{ scale: 1.25 }}
        animate={{ scale: 1 }}
        transition={{
          duration: 1,
        }}
        className="relative z-10 w-full max-w-[340px]"
      >
        <div className="mb-10 flex flex-col items-center">
          <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-full border ${classNames.border} ${classNames.surface} shadow-sm`}>
            <svg width="22" height="22" viewBox="0 0 100 100" fill="none">
              <path
                d="M20 20L80 80"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M20 40L60 80"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M20 60L40 80"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <h1 className={`text-lg font-medium ${classNames.text.primary}`}>
            Log in to Army of One AI
          </h1>

          <p className={`mt-2 text-center text-sm ${classNames.text.secondary}`}>
            Manage projects, tasks and workflows in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className={`flex h-12 w-full items-center justify-center gap-3 rounded-full ${classNames.button.primary.bg}
            ${classNames.button.primary.text} text-sm font-medium cursor-pointer
            shadow-[var(--shadow-soft)] transition-all hover:bg-[var(--btn-primary-bg-hover)] active:scale-[0.98]`}
        >
          <GoogleIcon />
          Continue with Google
        </button>
      </motion.div>
    </motion.div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path
        fill="var(--google-yellow)"
        d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="var(--google-red)"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="var(--google-green)"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.1 0-9.5-3.2-11.2-7.7l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="var(--google-blue)"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C36.9 39.3 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
