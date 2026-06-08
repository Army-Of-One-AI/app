-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "epic_id" TEXT;

-- CreateTable
CREATE TABLE "Epic" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" JSONB,
    "color" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "project_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "Epic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Epic_project_id_deleted_at_idx" ON "Epic"("project_id", "deleted_at");

-- CreateIndex
CREATE INDEX "Epic_project_id_position_idx" ON "Epic"("project_id", "position");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_epic_id_fkey" FOREIGN KEY ("epic_id") REFERENCES "Epic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Epic" ADD CONSTRAINT "Epic_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
