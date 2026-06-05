-- DropIndex
DROP INDEX "TaskActivityLog_project_id_created_at_idx";

-- DropIndex
DROP INDEX "TaskActivityLog_task_id_created_at_idx";

-- DropIndex
DROP INDEX "TaskActivityLog_user_id_created_at_idx";

-- CreateIndex
CREATE INDEX "TaskActivityLog_task_id_created_at_id_idx" ON "TaskActivityLog"("task_id", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "TaskActivityLog_user_id_created_at_idx" ON "TaskActivityLog"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "TaskActivityLog_project_id_created_at_idx" ON "TaskActivityLog"("project_id", "created_at" DESC);
