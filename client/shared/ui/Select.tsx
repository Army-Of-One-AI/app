/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { AnimatePresence, motion } from "motion/react";
import { HTMLAttributes, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

type Option = {
  label: string | number;
  value: string | number;
};

type Props = {
  items: Option[];
  searchable?: boolean;
  selectedValue?: string | number;
  onItemClicked: (value: string | number) => void;
  className?: HTMLAttributes<HTMLDivElement>["className"];
  placeholder?: string;
  showAllOption?: boolean;
  allOptionLabel?: string;
};

const ALL_VALUE = "__all__";

export default function Select({
  items,
  searchable = false,
  selectedValue,
  onItemClicked,
  className,
  placeholder = "Select an option",
  allOptionLabel = "All items",
  showAllOption = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const [searchText, setSearchText] = useState("");
  const [isOpen, setOpen] = useState(false);

  const normalizedSelectedValue =
    selectedValue === undefined ||
    selectedValue === null ||
    selectedValue === ""
      ? ALL_VALUE
      : selectedValue;

  const options = useMemo<Option[]>(() => {
    if (!showAllOption) return items;

    return [
      {
        label: allOptionLabel,
        value: ALL_VALUE,
      },
      ...items,
    ];
  }, [items, showAllOption, allOptionLabel]);

  const selectedOption = useMemo(() => {
    return options.find((item) => item.value === normalizedSelectedValue);
  }, [options, normalizedSelectedValue]);

  const filteredItems = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) return options;

    return options.filter((item) =>
      item.label.toString().toLowerCase().includes(keyword)
    );
  }, [searchText, options]);

  useEffect(() => {
    if (!isOpen) setSearchText("");
  }, [isOpen]);

  useEffect(() => {
    const handleOnClickOutside = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOnClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleOnClickOutside);
  }, []);

  const handleSelect = (value: string | number) => {
    if (showAllOption && value === ALL_VALUE) {
      onItemClicked("");
    } else {
      onItemClicked(value);
    }

    setOpen(false);
    setSearchText("");
  };

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((curr) => !curr)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-(--border) bg-(--surface) px-3 py-2.5 text-left text-sm text-(--text-primary) shadow-sm outline-none transition hover:border-(--primary)/60 focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
      >
        <span
          className={`truncate ${
            selectedOption ? "text-(--text-primary)" : "text-(--text-muted)"
          }`}
        >
          {selectedOption?.label ?? placeholder}
        </span>

        <ChevronDown
          size={16}
          className={`shrink-0 text-(--text-muted) transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-(--border) bg-(--surface) shadow-xl"
          >
            {searchable && (
              <div className="flex items-center gap-2 border-b border-(--border) px-3 py-2">
                <Search size={15} className="text-(--text-muted)" />

                <input
                  autoFocus
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-transparent text-sm text-(--text-primary) outline-none placeholder:text-(--text-muted)"
                />

                {searchText && (
                  <button
                    type="button"
                    onClick={() => setSearchText("")}
                    className="rounded-md p-1 text-(--text-muted) hover:bg-(--surface-secondary) hover:text-(--text-primary)"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            <div className="max-h-64 overflow-y-auto p-1.5">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const isSelected = item.value === normalizedSelectedValue;

                  return (
                    <button
                      type="button"
                      key={item.value}
                      onClick={() => handleSelect(item.value)}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                        isSelected
                          ? "bg-(--selected) text-(--primary)"
                          : "text-(--text-primary) hover:bg-(--surface-secondary)"
                      }`}
                    >
                      <span className="truncate">{item.label}</span>

                      {isSelected && (
                        <Check
                          size={15}
                          className="shrink-0 text-(--primary)"
                        />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-6 text-center text-sm text-(--text-muted)">
                  No results found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
