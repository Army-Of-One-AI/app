'use client'

type Props = {
    onClickDelete?: () => void;
    onClickArchive?: () => void;
}

const itemClassName = "cursor-pointer hover:bg-(--secondary) text-[var(--text-primary)] px-4 py-2 text-[14px]"

export default function TaskActions({ onClickDelete, onClickArchive }: Props) {
    return (
        <div className="w-full flex flex-col py-2">
            <div className={itemClassName} onClick={() => onClickArchive?.()}>Archive</div>
            <div className={itemClassName} onClick={() => onClickDelete?.()}>Delete</div>
        </div>
    )
}