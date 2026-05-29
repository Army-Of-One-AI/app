import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "border-[#4F46E5] bg-[#4F46E5] text-white hover:bg-[#4338CA]",
  secondary: "border-[#06B6D4] bg-[#06B6D4] text-white hover:bg-[#0891B2]",
  danger: "border-[#EF4444] bg-[#EF4444] text-white hover:bg-[#DC2626]",
  ghost: "border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F7F8FC]",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-10 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
