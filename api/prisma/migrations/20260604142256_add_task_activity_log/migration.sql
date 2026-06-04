-- CreateEnum
CREATE TYPE "TaskActivity" AS ENUM ('TASK_CREATED', 'TASK_ARCHIVED', 'TASK_RESTORED', 'TASK_DELETED', 'TITLE_CHANGED', 'DESCRIPTION_UPDATED', 'STATUS_CHANGED', 'PRIORITY_CHANGED', 'ASSIGNEE_CHANGED', 'DUE_DATE_CHANGED', 'SUBTASK_CREATED', 'SUBTASK_REMOVED', 'COMMENT_ADDED', 'COMMENT_EDITED', 'COMMENT_DELETED');

-- CreateTable
CREATE TABLE "TaskActivityLog" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT,
    "actor_name_snapshot" TEXT,
    "actor_avatar_snapshot" TEXT,
    "activity" "TaskActivity" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskActivityLog_task_id_created_at_idx" ON "TaskActivityLog"("task_id", "created_at");

-- CreateIndex
CREATE INDEX "TaskActivityLog_user_id_created_at_idx" ON "TaskActivityLog"("user_id", "created_at");
