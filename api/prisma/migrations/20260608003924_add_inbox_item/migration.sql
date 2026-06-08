-- CreateEnum
CREATE TYPE "InboxItemType" AS ENUM ('TASK_ASSIGNED', 'PROJECT_ADDED', 'WORKSPACE_INVITED', 'COMMENT_MENTIONED', 'DUE_DATE_CHANGED');

-- CreateTable
CREATE TABLE "InboxItem" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "workspace_id" TEXT,
    "project_id" TEXT,
    "task_id" TEXT,
    "invite_id" TEXT,
    "type" "InboxItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "read_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "InboxItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InboxItem_user_id_read_at_created_at_idx" ON "InboxItem"("user_id", "read_at", "created_at" DESC);

-- CreateIndex
CREATE INDEX "InboxItem_user_id_archived_at_created_at_idx" ON "InboxItem"("user_id", "archived_at", "created_at" DESC);

-- CreateIndex
CREATE INDEX "InboxItem_workspace_id_created_at_idx" ON "InboxItem"("workspace_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "InboxItem_project_id_created_at_idx" ON "InboxItem"("project_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "InboxItem_task_id_idx" ON "InboxItem"("task_id");

-- CreateIndex
CREATE INDEX "InboxItem_invite_id_idx" ON "InboxItem"("invite_id");

-- CreateIndex
CREATE INDEX "WorkspaceInvite_email_idx" ON "WorkspaceInvite"("email");

-- CreateIndex
CREATE INDEX "WorkspaceInvite_workspace_id_idx" ON "WorkspaceInvite"("workspace_id");

-- AddForeignKey
ALTER TABLE "InboxItem" ADD CONSTRAINT "InboxItem_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboxItem" ADD CONSTRAINT "InboxItem_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboxItem" ADD CONSTRAINT "InboxItem_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboxItem" ADD CONSTRAINT "InboxItem_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboxItem" ADD CONSTRAINT "InboxItem_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboxItem" ADD CONSTRAINT "InboxItem_invite_id_fkey" FOREIGN KEY ("invite_id") REFERENCES "WorkspaceInvite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
