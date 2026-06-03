"use client";

import { createContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

type OpenModalOption = {
  title?: string;
  modalContent: React.ReactNode;
};

export const ModalContext = createContext<{
  openModal: (opt: OpenModalOption) => void;
  closeModal: () => void;
}>({
  openModal: () => {},
  closeModal: () => {},
});

export default function ModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);

  const value = useMemo(
    () => ({
      openModal: (opt: OpenModalOption) => {
        setModalContent(opt.modalContent);
        setModalTitle(opt.title || "");
      },
      closeModal: () => setModalContent(null),
    }),
    []
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
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/20"
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
              className="flex flex-col rounded-lg bg-white p-6 shadow-2xl"
            >
              <div className="flex w-full flex-row items-center justify-between border-b border-solid border-black/15 pb-4">
                <div className="text-md font-bold text-black/60">
                  {modalTitle}
                </div>

                <button onClick={() => setModalContent(null)}>
                  <X className="text-black/50" />
                </button>
              </div>

              <div className="pt-5">{modalContent}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
}
