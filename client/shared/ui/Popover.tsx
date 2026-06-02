'use client';

import { AnimatePresence, motion } from 'motion/react';
import { classNames } from '../styles/classNames';
import { useEffect, useRef } from 'react';

type Props = {
  children: React.ReactNode;
  isOpen: boolean;
  content: React.ReactNode;
  onClose?: () => void;
};

export default function Popover({ children, isOpen, content, onClose }: Props) {
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose?.()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div ref={popoverRef} className="relative inline-block">
      {children}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="popover"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className={`
              absolute left-0 top-full z-[999] mt-2 min-w-60
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