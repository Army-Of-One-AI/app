CREATE TYPE "ProjectPlanningJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED');

CREATE TABLE "ProjectPlanningJob" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "project_name" TEXT NOT NULL,
    "idea" TEXT NOT NULL,
    "generation_mode" TEXT NOT NULL DEFAULT 'FAST',
    "status" "ProjectPlanningJobStatus" NOT NULL DEFAULT 'PENDING',
    "current_phase" TEXT,
    "error" TEXT,
    "total_steps" INTEGER NOT NULL DEFAULT 0,
    "completed_steps" INTEGER NOT NULL DEFAULT 0,
    "current_item" TEXT,
    "product_vision" JSONB NOT NULL,
    "selected_features" JSONB NOT NULL,
    "generated_documents" JSONB,
    "generated_tasks" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "ProjectPlanningJob_pkey" PRIMARY KEY ("id")
);
