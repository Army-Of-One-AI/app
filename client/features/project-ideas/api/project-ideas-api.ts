import apiClient from "@/shared/api/api-client";
import { createDocument } from "@/features/documents/api/documents-api";
import { createProject } from "@/features/projects/api/projects-api";
import { createTask } from "@/features/tasks/api/tasks-api";
import type { TaskPriority } from "@/features/tasks/types";
import type {
  CreatedProjectFromIdea,
  CreateProjectFromIdeaInput,
  ExecutionPlan,
  GeneratePlanJob,
  GenerationMode,
  PlanningDocuments,
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
  const response = await apiClient.post<StartGeneratePlanJobResponse>("/project-ideas/planning-jobs", input);
  return response.data;
}

export async function getGeneratePlanJob(jobId: string) {
  const response = await apiClient.get<GeneratePlanJob>(`/project-ideas/planning-jobs/${jobId}`);
  return response.data;
}

export async function cancelGeneratePlanJob(jobId: string) {
  const response = await apiClient.post<GeneratePlanJob>(`/project-ideas/planning-jobs/${jobId}/cancel`);
  return response.data;
}

function findBacklogColumnId(project: Awaited<ReturnType<typeof createProject>>) {
  const columns = project.boards?.flatMap((board) => board.columns ?? []) ?? [];
  return columns.find((column) => column.name.trim().toLowerCase() === "backlog")?.id ?? columns[0]?.id;
}

function section(title: string, content: string | string[]) {
  const values = Array.isArray(content) ? content : [content];
  const body = values.filter(Boolean).map((item) => `- ${item}`).join("\n");
  return [`## ${title}`, body || "No content provided for this section."].join("\n");
}

function planningDocumentPayloads(documents: PlanningDocuments) {
  return [
    {
      title: "Product Requirements Document",
      content: [
        `# ${documents.prd.title || "Product Requirements Document"}`,
        section("Overview", documents.prd.overview),
        section("Problem Statement", documents.prd.problemStatement),
        section("Goals", documents.prd.goals),
        section("Users", documents.prd.targetUsers),
        section("User Personas", documents.prd.userPersonas),
        section("Core User Flows", documents.prd.coreUserFlows),
        section("Functional Requirements", documents.prd.functionalRequirements),
        section("Non Functional Requirements", documents.prd.nonFunctionalRequirements),
        section("Permissions", documents.prd.permissions),
        section("Data Requirements", documents.prd.dataRequirements),
        section("Notifications", documents.prd.notifications),
        section("Edge Cases", documents.prd.edgeCases),
        section("Constraints", documents.prd.constraints),
        section("Non-goals", documents.prd.nonGoals),
        section("Success Metrics", documents.prd.successMetrics),
        ...documents.prd.featureRequirements.map((feature) =>
          [
            `## ${feature.featureTitle}`,
            section("Description", feature.description),
            section("User Value", feature.userValue),
            section("Expected Behavior", feature.expectedBehavior),
            section("Dependencies", feature.dependencies),
            section("Edge Cases", feature.edgeCases),
            section("Acceptance Criteria", feature.acceptanceCriteria),
          ].join("\n\n"),
        ),
      ].join("\n\n"),
    },
    {
      title: "MVP Scope",
      content: [
        "# MVP Scope",
        section("Included Features", documents.mvpScope.includedFeatures),
        section("Excluded Features", documents.mvpScope.excludedFeatures),
        section("Build Order", documents.mvpScope.buildOrder),
        section("Assumptions", documents.mvpScope.assumptions),
        section("Risks", documents.mvpScope.risks),
        section("Dependencies", documents.mvpScope.dependencies),
        section("Tradeoffs", documents.mvpScope.tradeoffs),
        section("Launch Criteria", documents.mvpScope.launchCriteria),
      ].join("\n\n"),
    },
    {
      title: "User Stories",
      content: [
        "# User Stories",
        ...documents.userStories.map((feature) =>
          [
            `## ${feature.featureTitle}`,
            ...feature.stories.map((story) =>
              [
                `### ${story.persona || "User"}`,
                story.story,
                section("Acceptance Criteria", story.acceptanceCriteria),
                `Priority: ${story.priority}`,
              ].join("\n\n"),
            ),
          ].join("\n\n"),
        ),
      ].join("\n\n"),
    },
    {
      title: "Milestones",
      content: [
        "# Milestones",
        ...documents.milestones.map((milestone) =>
          [
            `## ${milestone.title}`,
            section("Objective", milestone.objective),
            section("Features", milestone.featureIds),
            section("Dependencies", milestone.dependencies),
            section("Outcome", milestone.outcome),
          ].join("\n\n"),
        ),
      ].join("\n\n"),
    },
    {
      title: "Acceptance Rules",
      content: [
        "# Acceptance Rules",
        section("UX Rules", documents.acceptanceRules.uxRules),
        section("Security Rules", documents.acceptanceRules.securityRules),
        section("Performance Rules", documents.acceptanceRules.performanceRules),
        section("Quality Rules", documents.acceptanceRules.qualityRules),
        section("Error Handling Rules", documents.acceptanceRules.errorHandlingRules),
        section("Release Checklist", documents.acceptanceRules.releaseChecklist),
        section("Testing Checklist", documents.acceptanceRules.testingChecklist),
      ].join("\n\n"),
    },
  ];
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

  await Promise.all(
    planningDocumentPayloads(input.documents).map((document) =>
      createDocument({
        projectId: project.id,
        title: document.title,
        content: document.content,
        sourceType: "MANUAL",
      }),
    ),
  );

  return {
    project,
    taskCount: tasks.length,
  };
}
