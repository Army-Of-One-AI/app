/*
  Warnings:

  - You are about to drop the column `is_archived` on the `Task` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "is_archived",
ADD COLUMN     "archived_at" TIMESTAMP(3);
