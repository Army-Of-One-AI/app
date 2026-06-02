/*
  Warnings:

  - The values [ProductOwner,ProjectManager,TechLead] on the enum `ProjectRole` will be removed. If these variants are still used in the database, this will fail.
  - The values [OnHold] on the enum `ProjectStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [InProgress] on the enum `TaskStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProjectRole_new" AS ENUM ('Owner', 'Product_Owner', 'Project_Manager', 'Tech_Lead', 'Designer', 'Developer', 'QC', 'DevOps', 'Member');
ALTER TABLE "public"."ProjectMember" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "ProjectMember" ALTER COLUMN "role" TYPE "ProjectRole_new" USING ("role"::text::"ProjectRole_new");
ALTER TYPE "ProjectRole" RENAME TO "ProjectRole_old";
ALTER TYPE "ProjectRole_new" RENAME TO "ProjectRole";
DROP TYPE "public"."ProjectRole_old";
ALTER TABLE "ProjectMember" ALTER COLUMN "role" SET DEFAULT 'Member';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ProjectStatus_new" AS ENUM ('Planning', 'Active', 'On_Hold', 'Completed', 'Archived');
ALTER TABLE "public"."Project" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Project" ALTER COLUMN "status" TYPE "ProjectStatus_new" USING ("status"::text::"ProjectStatus_new");
ALTER TYPE "ProjectStatus" RENAME TO "ProjectStatus_old";
ALTER TYPE "ProjectStatus_new" RENAME TO "ProjectStatus";
DROP TYPE "public"."ProjectStatus_old";
ALTER TABLE "Project" ALTER COLUMN "status" SET DEFAULT 'Planning';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TaskStatus_new" AS ENUM ('Backlog', 'Todo', 'In_Progress', 'Review', 'Done', 'Canceled');
ALTER TABLE "public"."Task" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Task" ALTER COLUMN "status" TYPE "TaskStatus_new" USING ("status"::text::"TaskStatus_new");
ALTER TYPE "TaskStatus" RENAME TO "TaskStatus_old";
ALTER TYPE "TaskStatus_new" RENAME TO "TaskStatus";
DROP TYPE "public"."TaskStatus_old";
ALTER TABLE "Task" ALTER COLUMN "status" SET DEFAULT 'Backlog';
COMMIT;
