import apiClient from "@/shared/api/api-client";
import { createProject } from "@/features/projects/api/projects-api";
import { createTask } from "@/features/tasks/api/tasks-api";
import type { TaskPriority } from "@/features/tasks/types";
import type {
  CreatedProjectFromIdea,
  CreateProjectFromIdeaInput,
  ExecutionPlan,
  GeneratePlanJob,
  GenerationMode,
  ProductFeature,
  ProjectIdeaInput,
  ProductVision,
  StartGeneratePlanJobInput,
  StartGeneratePlanJobResponse,
} from "../types";

function taskPriorityFromProductPriority(priority: ProductFeature["priority"] | TaskPriority): TaskPriority {
  if (priority === "CRITICAL") return "URGENT";
  return priority;
}

export async function expandProjectIdea(input: ProjectIdeaInput): Promise<ProductVision> {
  const response = await apiClient.post<ProductVision>("/project-ideas/expand", input);
  return response.data;
}

export async function generateExecutionPlan(input: { features: ProductFeature[]; generationMode: GenerationMode }): Promise<ExecutionPlan> {
  const response = await apiClient.post<ExecutionPlan>("/project-ideas/generate-plan", input);
  return response.data;
}

export async function startGeneratePlanJob(input: StartGeneratePlanJobInput) {
  const response = await apiClient.post<StartGeneratePlanJobResponse>("/project-ideas/generate-plan/jobs", input);
  return response.data;
}

export async function getGeneratePlanJob(jobId: string) {
  const response = await apiClient.get<GeneratePlanJob>(`/project-ideas/generate-plan/jobs/${jobId}`);
  return response.data;
}

export async function cancelGeneratePlanJob(jobId: string) {
  const response = await apiClient.post<GeneratePlanJob>(`/project-ideas/generate-plan/jobs/${jobId}/cancel`);
  return response.data;
}

function findBacklogColumnId(project: Awaited<ReturnType<typeof createProject>>) {
  const columns = project.boards?.flatMap((board) => board.columns ?? []) ?? [];
  return columns.find((column) => column.name.trim().toLowerCase() === "backlog")?.id ?? columns[0]?.id;
}

export async function createProjectFromIdea(input: CreateProjectFromIdeaInput): Promise<CreatedProjectFromIdea> {
  const project = await createProject({
    workspaceId: input.idea.workspaceId,
    name: input.idea.projectName,
    description: input.vision.vision,
  });
  const backlogColumnId = findBacklogColumnId(project);
  const tasks = input.plan.features.flatMap((featureItem) => featureItem.tasks);

  await Promise.all(
    tasks.map((task, order) =>
      createTask({
        projectId: project.id,
        columnId: backlogColumnId,
        title: task.title,
        description: `${task.description}\n\nSuggested role: ${task.suggestedRole}`,
        priority: taskPriorityFromProductPriority(task.priority),
        status: "BACKLOG",
        order,
        acceptanceCriteria: task.acceptanceCriteria,
      }),
    ),
  );

  return {
    project,
    taskCount: tasks.length,
  };
}
