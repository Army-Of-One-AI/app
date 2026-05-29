-- CreateEnum
CREATE TYPE "ProjectIdeaPlanJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ProjectIdeaPlanJob" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "project_name" TEXT NOT NULL,
    "idea" TEXT NOT NULL,
    "generation_mode" TEXT NOT NULL DEFAULT 'FAST',
    "status" "ProjectIdeaPlanJobStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "total_features" INTEGER NOT NULL DEFAULT 0,
    "completed_features" INTEGER NOT NULL DEFAULT 0,
    "current_feature_id" TEXT,
    "current_feature_title" TEXT,
    "product_vision" JSONB NOT NULL,
    "selected_features" JSONB NOT NULL,
    "result_plan" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "ProjectIdeaPlanJob_pkey" PRIMARY KEY ("id")
);
