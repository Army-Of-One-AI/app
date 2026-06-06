/*
  Warnings:

  - A unique constraint covering the columns `[workspace_id,email]` on the table `WorkspaceInvite` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceInvite_workspace_id_email_key" ON "WorkspaceInvite"("workspace_id", "email");
