"use client";

import { createContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { classNames } from "@/shared/styles/classNames";

type OpenModalOption = {
  title?: string;
  customHeader?: React.ReactNode;
  showHeader?: boolean;
  modalContent: React.ReactNode;
};

export const ModalContext = createContext<{
  openModal: (opt: OpenModalOption) => void;
  closeModal: () => void;
  isOpen: boolean;
}>({
  openModal: () => {},
  closeModal: () => {},
  isOpen: false,
});

export default function ModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  const [header, setHeader] = useState<React.ReactNode>(null);
  const [showHeader, setShowHeader] = useState(true);
  const isOpen = modalContent !== null;

  const value = useMemo(
    () => ({
      openModal: (opt: OpenModalOption) => {
        setModalContent(opt.modalContent);
        setModalTitle(opt.title || "");
        setHeader(opt.customHeader || null);
        setShowHeader(opt.showHeader ?? true);
      },
      closeModal: () => setModalContent(null),
      isOpen,
    }),
    [isOpen]
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      <AnimatePresence mode="wait">
        {modalContent && (
          <motion.div
            key="modal"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 0.15,
            }}
            onClick={(e) =>
              e.target === e.currentTarget && setModalContent(null)
            }
            className={`fixed inset-0 z-[999] flex items-center justify-center ${classNames.overlay}`}
          >
            <motion.div
              initial={{
                opacity: 0,
                y: 40,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 40,
                scale: 0.98,
              }}
              transition={{
                type: "spring",
                stiffness: 450,
                damping: 35,
                mass: 0.8,
              }}
              className={`flex flex-col rounded-lg ${classNames.surface} px-6 pb-6 shadow-2xl`}
            >
              {showHeader && (
                <div
                  className={`flex w-full flex-row items-center pt-6 justify-between border-b border-solid ${classNames.border} pb-4`}
                >
                  {!header && (
                    <>
                      <div
                        className={`text-md font-bold ${classNames.text.secondary}`}
                      >
                        {modalTitle}
                      </div>

                      <button onClick={() => setModalContent(null)}>
                        <X className={classNames.text.secondary} />
                      </button>
                    </>
                  )}
                  {header && header}
                </div>
              )}

              <div className="pt-5">{modalContent}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
}
