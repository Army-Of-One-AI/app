"use client";

import React, { HTMLAttributes } from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  className?: HTMLAttributes<HTMLButtonElement>["className"];
};

const variants = {
  primary: {
    bg: "bg-[var(--btn-primary-bg)]",
    hover: "hover:bg-[var(--btn-primary-bg-hover)]",
    text: "text-[var(--btn-primary-color)]",
    border: "border-transparent",
  },
  secondary: {
    bg: "bg-[var(--btn-secondary-bg)]",
    hover: "hover:bg-[var(--btn-secondary-bg-hover)]",
    text: "text-[var(--btn-secondary-color)]",
    border: "border border-[var(--btn-secondary-border)]",
  },
};

export default function Button({
  children,
  variant = "primary",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const styles = variants[variant];

  return (
    <button
      disabled={disabled}
      className={`
        ${styles.bg}
        ${styles.hover}
        ${styles.text}
        ${styles.border}
        px-4 py-2
        rounded-lg
        font-medium
        text-sm
        transition-colors
        duration-200
        cursor-pointer
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
