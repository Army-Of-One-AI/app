"use client";

import React, { HTMLAttributes } from "react";
import { classNames } from "../styles/classNames";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  className?: HTMLAttributes<HTMLButtonElement>["className"];
};

export default function Button({
  children,
  variant = "primary",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const styles = classNames.button[variant];

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
