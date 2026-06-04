"use client";

import { useContext } from "react";
import { ModalContext } from "../providers/ModalProvider";

export default function useModal() {
  const { openModal, closeModal, isOpen } = useContext(ModalContext);

  return {
    openModal,
    closeModal,
    isOpen,
  };
}
