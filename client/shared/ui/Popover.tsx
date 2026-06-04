"use client";

import { AnimatePresence, motion } from "motion/react";
import { classNames } from "../styles/classNames";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  isOpen: boolean;
  content: React.ReactNode;
  onClose?: () => void;
  position?: "left" | "right" | "middle";
};

export default function Popover({
  children,
  isOpen,
  content,
  onClose,
  position = "middle",
}: Props) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<{
    left?: string;
    translateX?: string;
    right?: string;
  }>({
    left: "0",
    translateX: "0",
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !contentRef.current || !popoverRef.current) return;

    const triggerRect = popoverRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();

    const contentWidth = contentRect.width;
    const viewportWidth = window.innerWidth;
    const gap = 8;

    if (position === "middle") {
      const newLeft =
        triggerRect.left + triggerRect.width / 2 - contentWidth / 2;

      if (newLeft < gap) {
        setStyle({
          left: "0",
          right: "auto",
          translateX: "0",
        });
      } else if (newLeft + contentWidth > viewportWidth - gap) {
        setStyle({
          left: "auto",
          right: "0",
          translateX: "0",
        });
      } else {
        setStyle({
          left: "50%",
          right: "auto",
          translateX: "-50%",
        });
      }

      return;
    }

    if (position === "left") {
      const newRight = triggerRect.left + contentWidth;

      if (newRight > viewportWidth - gap) {
        setStyle({
          left: "auto",
          right: "0",
          translateX: "0",
        });
      } else {
        setStyle({
          left: "0",
          right: "auto",
          translateX: "0",
        });
      }

      return;
    }

    const newLeft = triggerRect.right - contentWidth;

    if (newLeft < gap) {
      setStyle({
        left: "0",
        right: "auto",
        translateX: "0",
      });
    } else {
      setStyle({
        left: "100%",
        right: "auto",
        translateX: "-100%",
      });
    }
  }, [isOpen, position]);

  return (
    <div ref={popoverRef} className="relative inline-block">
      {children}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={contentRef}
            key="popover"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            style={style}
            className={`
              absolute top-full z-[999] mt-2 min-w-60
              rounded-md border p-2 shadow-lg
              ${classNames.background}
              ${classNames.border}
            `}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
