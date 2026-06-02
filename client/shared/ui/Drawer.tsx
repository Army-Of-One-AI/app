"use client";

import { AnimatePresence, motion } from "motion/react";
import { classNames } from "../styles/classNames";
import { HTMLAttributes, useEffect, useRef } from "react";
import { X } from "lucide-react";

export enum DrawerDirection {
  Left = "Left",
  Right = "Right",
  Top = "Top",
  Bottom = "Bottom",
}

type Props = {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  direction?: DrawerDirection;
  className?: HTMLAttributes<HTMLDivElement>["className"];
};

export default function Drawer({
  children,
  isOpen,
  onClose,
  className,
  direction = DrawerDirection.Right,
}: Props) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const getStyleByDirection = () => {
    switch (direction) {
      case DrawerDirection.Bottom:
        return {
          bottom: 0,
          left: 0,
          width: "100vw",
        };
      case DrawerDirection.Left:
        return {
          top: 0,
          left: 0,
          height: "100vh",
        };
      case DrawerDirection.Top:
        return {
          top: 0,
          left: 0,
          width: "100vw",
        };
      case DrawerDirection.Right:
      default:
        return {
          right: 0,
          top: 0,
          height: "100vh",
        };
    }
  };

  const getAnimationByDirection = () => {
    switch (direction) {
      case DrawerDirection.Bottom:
        return {
          initial: { y: "100%" },
          animate: { y: 0 },
          exit: { y: "100%" },
        };
      case DrawerDirection.Top:
        return {
          initial: { y: "-100%" },
          animate: { y: 0 },
          exit: { y: "-100%" },
        };
      case DrawerDirection.Left:
        return {
          initial: { x: "-100%" },
          animate: { x: 0 },
          exit: { x: "-100%" },
        };
      case DrawerDirection.Right:
      default:
        return {
          initial: { x: "100%" },
          animate: { x: 0 },
          exit: { x: "100%" },
        };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          style={getStyleByDirection()}
          ref={drawerRef}
          initial={getAnimationByDirection().initial}
          animate={getAnimationByDirection().animate}
          exit={getAnimationByDirection().exit}
          transition={{
            type: "spring",
            duration: 0.5,
            bounce: 0.25,
          }}
          className={`fixed z-9999 rounded-l-xl shadow-lg flex flex-col ${classNames.surface} ${className} overflow-y-auto`}
        >
          <div className="w-full pt-4 flex items-center justify-end px-4">
            <X onClick={() => onClose()} className="cursor-pointer" size={20} />
          </div>
          <div>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
