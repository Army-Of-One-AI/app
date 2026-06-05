"use client";

import { classNames } from "@/shared/styles/classNames";

type Props = {
  onClickDelete?: () => void;
  onClickArchive?: () => void;
};

const itemClassName = `cursor-pointer hover:bg-[var(--secondary)] text-[var(--text-primary)] 
    px-4 py-2 text-[15px] cursor-pointer
  ${classNames.text.primary} rounded-lg
  ${classNames.surface} hover:bg-(--secondary)
  hover:brightness-95 transition-all`;

export default function TaskActions({ onClickDelete, onClickArchive }: Props) {
  return (
    <div
      className={`w-full flex flex-col p-2 shadow-lg rounded-lg overflow-x-hidden ${classNames.surface}`}
    >
      <div className={itemClassName} onClick={() => onClickArchive?.()}>
        Archive
      </div>
      <div className={itemClassName} onClick={() => onClickDelete?.()}>
        Delete
      </div>
    </div>
  );
}
