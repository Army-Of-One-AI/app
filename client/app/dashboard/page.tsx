'use client'

import { logOut } from "@/features/auth/api/logOut";
import CreateWorkspaceModal from "@/features/workspaces/components/CreateWorkspaceModal";
import { ModalContext } from "@/shared/providers/ModalProvider";
import { useContext, useState } from "react";

export default function DashboardPage() {
  const { openModal, closeModal } = useContext(ModalContext);

  const handleOpenModal = () => {
    openModal({
      modalContent: <CreateWorkspaceModal onClose={closeModal} onCreate={() => { }} />,
      title: "Create new workspace",
    })
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[red]">
      <h1 className="text-4xl font-bold">Welcome to the Dashboard!</h1>
      <button onClick={logOut}>Log Out</button>
      <button onClick={() => handleOpenModal()}>Create Workspace</button>
    </div>
  );
}