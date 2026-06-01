'use client';

import { HTMLAttributes } from "react";

type ButtonProps = {
    type?: 'primary' | 'secondary';
    children: React.ReactNode;
    onClick: () => void;
    style?: React.CSSProperties
    className?: HTMLAttributes<HTMLButtonElement>['className']
};

export default function Button({
    children,
    onClick,
    style,
    className,
    type = "primary"
}: ButtonProps) {
    return (
        <button style={{
            backgroundColor: type === "primary" ? "#462C7D" : "grey",
            ...style,
        }} className={`${className} text-[white] px-4 py-2 rounded-lg font-medium cursor-pointer text-sm`} onClick={onClick} type='submit'>
            {children}
        </button>
    );
}