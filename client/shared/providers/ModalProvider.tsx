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
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={(e) =>
              e.target === e.currentTarget && setModalContent(null)
            }
            className="fixed inset-0 z-[999] flex items-center justify-center bg-transparent"
          >
            <div className="p-6 flex flex-col bg-[white] shadow-2xl rounded-lg">
              <div className="w-full pb-4 flex flex-row items-center justify-between border-b border-solid border-black/15">
                <div className="font-bold text-black/50 text-lg">
                  {modalTitle}
                </div>
                <div onClick={() => setModalContent(null)}>
                  <X className="text-black/50" />
                </div>
              </div>
              <div className="pt-5">{modalContent}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
}
