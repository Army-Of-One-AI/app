'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronRight } from 'lucide-react';
import { classNames } from '@/shared/styles/classNames';
import { useParams } from 'next/navigation';
import { GetCurrentUserInfoResponse } from '@/features/auth/types';
import Link from 'next/link';

const itemClass = `
  flex h-7 w-full items-center justify-between
  rounded-md px-2 text-[12px]
  cursor-pointer
  ${classNames.text.primary}
  ${classNames.hover.surface}
`;

export default function UserPopoverContent({ userInfo }: { userInfo?: GetCurrentUserInfoResponse }) {
    const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);

    return (
        <div className="w-64">
            <button type="button" className={itemClass}>
                Settings
            </button>

            <button type="button" className={itemClass}>
                Invite and manage members
            </button>

            <div className={`-mx-1.5 my-1.5 border-t ${classNames.border}`} />

            <button type="button" className={itemClass}>
                Download desktop app
            </button>

            <div className={`-mx-1.5 my-1.5 border-t ${classNames.border}`} />

            <div
                className="relative"
                onMouseEnter={() => setShowWorkspaceMenu(true)}
                onMouseLeave={() => setShowWorkspaceMenu(false)}
            >
                <button type="button" className={itemClass}>
                    <span>Switch workspace</span>
                    <ChevronRight size={13} className={classNames.text.secondary} />
                </button>

                <AnimatePresence>
                    {showWorkspaceMenu && (
                        <motion.div
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -4 }}
                            transition={{ duration: 0.1 }}
                            className={`
                            absolute left-full top-0 z-[1000] ml-1
                            w-72 rounded-xl border p-1.5 shadow-xl
                            ${classNames.background}
                            ${classNames.border}
              `}
                        >
                            <WorkspaceSubmenu userInfo={userInfo} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className={`-mx-1.5 my-1.5 border-t ${classNames.border}`} />

            <button type="button" className={itemClass}>
                Log out
            </button>
        </div>
    );
}

function WorkspaceSubmenu({ userInfo }: { userInfo?: GetCurrentUserInfoResponse }) {
    const params = useParams()
    const slug = params.workspaceSlug as string;

    return (
        <div className="w-full space-y-0.5">
            <p className={`px-2 pb-1 text-[12px] ${classNames.text.secondary}`}>
                {userInfo?.email}
            </p>

            {userInfo?.workspaces.map((workspace) => (
                <WorkspaceItem
                    key={workspace.id}
                    name={workspace.name}
                    slug={workspace.slug}
                    initials={workspace.name.charAt(0)}
                    active={workspace.slug === slug}
                />
            ))}

            <div className={`px-2 pt-2 pb-1 text-[12px] ${classNames.text.secondary}`}>
                Account
            </div>

            <Link href={"/new-workspace"} className={itemClass}>
                Create a new workspace
            </Link>
        </div>
    );
}

type WorkspaceItemProps = {
    initials: string;
    name: string;
    active?: boolean;
    slug: string;
};

function WorkspaceItem({
    initials,
    name,
    slug,
    active = false,
}: WorkspaceItemProps) {
    return (
        <Link
            href={`/${slug}`}
            className={`
            flex h-8 w-full items-center gap-2
            rounded-md px-2 text-[12px]
            cursor-pointer
            ${classNames.text.primary}
            ${classNames.hover.surface}
        `}
        >
            <div
                className={`
          flex h-6 w-6 shrink-0 items-center justify-center
          rounded-full text-[10px] font-semibold
          ${classNames.primary.bg}
          ${classNames.primary.text}
        `}
            >
                {initials}
            </div>

            <span className="min-w-0 flex-1 truncate text-left">{name}</span>

            {active && <Check size={14} className={classNames.text.secondary} />}
        </Link>
    );
}