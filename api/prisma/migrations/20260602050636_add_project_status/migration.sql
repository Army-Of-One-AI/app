-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('Planning', 'Active', 'OnHold', 'Completed', 'Archived');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "start_date" TIMESTAMP(3),
ADD COLUMN     "status" "ProjectStatus" NOT NULL DEFAULT 'Planning',
ADD COLUMN     "target_date" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_workspace_id_status_idx" ON "Project"("workspace_id", "status");
