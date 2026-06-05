-- DropIndex
DROP INDEX "TaskActivityLog_task_id_created_at_idx";

-- CreateIndex
CREATE INDEX "TaskActivityLog_task_id_created_at_idx" ON "TaskActivityLog"("task_id", "created_at" DESC);
