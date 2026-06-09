"use client";

import useSlugs from "@/shared/hooks/useSlugs";
import {
  ArrowRight,
  BriefcaseBusiness,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";

const settingsCards = [
  {
    title: "Profile",
    description: "Update your avatar, name, contact details, and preferences.",
    href: "/settings/profile",
    icon: User,
  },
  {
    title: "Members",
    description: "Invite people, review roles, and track workspace invites.",
    href: "/settings/members",
    icon: Users,
  },
  {
    title: "Workspace",
    description: "Manage workspace identity, URL, branding, and deletion.",
    href: "/settings/workspace",
    icon: BriefcaseBusiness,
  },
];

export default function SettingsPage() {
  const { workspace } = useSlugs();

  return (
    <main className="w-full px-6 py-8 lg:px-10 lg:py-10">
      <div className="max-w-5xl">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
          <ShieldCheck size={16} />
          Workspace settings
        </div>

        <h1 className="mt-3 text-2xl font-semibold tracking-normal text-[var(--text-primary)]">
          Settings
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Manage your account, workspace access, and team-level configuration.
        </p>

        <section className="mt-8 grid gap-3 md:grid-cols-3">
          {settingsCards.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={`/${workspace.slug}${item.href}`}
                className="
                  group rounded-2xl border border-[var(--border)] bg-[var(--surface)]
                  p-4 shadow-xs transition hover:-translate-y-0.5 hover:bg-[var(--secondary)]
                "
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--text-primary)] group-hover:bg-[var(--surface)]">
                    <Icon size={18} />
                  </span>

                  <ArrowRight
                    size={16}
                    className="mt-1 text-[var(--text-secondary)] opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                  />
                </div>

                <h2 className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
                  {item.title}
                </h2>

                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                  {item.description}
                </p>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
