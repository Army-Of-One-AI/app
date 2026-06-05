"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";

type SearchBarProps = {
  value?: string;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
};

export default function SearchBar({
  value,
  placeholder = "Search...",
  autoFocus = false,
  className = "",
  onChange,
  onClear,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState("");

  const searchValue = value ?? internalValue;

  const handleChange = (nextValue: string) => {
    setInternalValue(nextValue);
    onChange?.(nextValue);
  };

  const handleClear = () => {
    setInternalValue("");
    onChange?.("");
    onClear?.();
  };

  return (
    <div
      className={`
        group flex h-10 w-full items-center gap-2 rounded-xl
        border border-[var(--border)] bg-[var(--surface)]
        px-3 transition-all
        focus-within:border-[var(--primary)]
        focus-within:ring-2 focus-within:ring-[var(--primary)]/20 brightness-90 focus-within:brightness-100
        ${className}
      `}
    >
      <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition-colors group-focus-within:text-[var(--text-primary)]" />

      <input
        autoFocus={autoFocus}
        value={searchValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="
          h-full min-w-0 flex-1 bg-transparent text-sm
          text-[var(--text-primary)] outline-none
          placeholder:text-[var(--text-muted)]
        "
      />

      {searchValue && (
        <button
          type="button"
          onClick={handleClear}
          className="
            flex h-6 w-6 shrink-0 items-center justify-center rounded-md
            text-[var(--text-muted)] transition-all
            hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]
          "
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
