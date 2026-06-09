-- CreateTable
CREATE TABLE "TaskLabel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "project_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "TaskLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TaskToTaskLabel" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TaskToTaskLabel_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "TaskLabel_name_idx" ON "TaskLabel"("name");

-- CreateIndex
CREATE INDEX "TaskLabel_project_id_idx" ON "TaskLabel"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "TaskLabel_name_project_id_key" ON "TaskLabel"("name", "project_id");

-- CreateIndex
CREATE INDEX "_TaskToTaskLabel_B_index" ON "_TaskToTaskLabel"("B");

-- AddForeignKey
ALTER TABLE "TaskLabel" ADD CONSTRAINT "TaskLabel_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskToTaskLabel" ADD CONSTRAINT "_TaskToTaskLabel_A_fkey" FOREIGN KEY ("A") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskToTaskLabel" ADD CONSTRAINT "_TaskToTaskLabel_B_fkey" FOREIGN KEY ("B") REFERENCES "TaskLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
