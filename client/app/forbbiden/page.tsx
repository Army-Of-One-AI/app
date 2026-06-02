import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { classNames } from '@/shared/styles/classNames';

export default function ForbiddenPage() {
  return (
    <main
      className={`
        flex min-h-screen items-center justify-center px-6
        ${classNames.background}
        ${classNames.text.primary}
      `}
    >
      <div className="w-full max-w-md text-center">
        <div
          className={`
            mx-auto mb-6 flex h-14 w-14 items-center justify-center
            rounded-full
            ${classNames.surface}
          `}
        >
          <ShieldAlert size={28} />
        </div>

        <h1 className="text-2xl font-semibold">
          Access denied
        </h1>

        <p
          className={`
            mt-3 text-sm
            ${classNames.text.secondary}
          `}
        >
          {`You don't have permission to access this page or resource.`}
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/"
            className="
              rounded-lg border px-4 py-2 text-sm
              transition-opacity hover:opacity-80
            "
          >
            Go home
          </Link>

          <Link
            href="/workspaces"
            className="
              rounded-lg px-4 py-2 text-sm
              bg-[var(--btn-primary-bg)]
              text-[var(--btn-primary-color)]
              hover:bg-[var(--btn-primary-bg-hover)]
            "
          >
            Switch workspace
          </Link>
        </div>
      </div>
    </main>
  );
}