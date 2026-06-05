/*
  Warnings:

  - Added the required column `project_id` to the `TaskActivityLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TaskActivityLog" ADD COLUMN     "project_id" TEXT NOT NULL;
