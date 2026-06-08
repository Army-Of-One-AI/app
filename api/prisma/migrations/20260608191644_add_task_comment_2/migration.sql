/*
  Warnings:

  - Added the required column `task_id` to the `TaskComment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TaskComment" ADD COLUMN     "task_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "TaskComment_task_id_reply_to_comment_id_created_at_id_idx" ON "TaskComment"("task_id", "reply_to_comment_id", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "TaskComment_reply_to_comment_id_created_at_id_idx" ON "TaskComment"("reply_to_comment_id", "created_at" ASC, "id" ASC);

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
