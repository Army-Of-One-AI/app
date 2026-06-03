-- AlterTable
ALTER TABLE "User" ADD COLUMN     "last_used_workspace_id" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_last_used_workspace_id_fkey" FOREIGN KEY ("last_used_workspace_id") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
