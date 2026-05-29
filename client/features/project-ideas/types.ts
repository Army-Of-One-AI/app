import type { Project } from "@/features/projects/types";
import type { TaskPriority } from "@/features/tasks/types";

export type ProductFeaturePriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type ProductFeatureStage = "MVP" | "V2" | "Future";
export type GenerationMode = "FAST" | "DEEP";

export type ProjectIdeaInput = {
  workspaceId: string;
  projectName: string;
  idea: string;
  targetAudience?: string;
  goals?: string;
  generationMode: GenerationMode;
};

export type ProductFeature = {
  id: string;
  title: string;
  summary: string;
  domain: string;
  priority: ProductFeaturePriority;
  stage: ProductFeatureStage;
};

export type ProductFeatureGroups = {
  mvp: ProductFeature[];
  v2: ProductFeature[];
  future: ProductFeature[];
};

export type ProductVision = {
  vision: string;
  goals: string[];
  targetUsers: string[];
  userStories: string[];
  domains: string[];
  features: ProductFeatureGroups;
  roadmap: string[];
};

export type ExecutionTask = {
  title: string;
  description: string;
  priority: TaskPriority;
  acceptanceCriteria: string;
  suggestedRole: "PM" | "DESIGNER" | "DEVELOPER" | "QC";
};

export type ExecutionPlanFeature = {
  featureId: string;
  featureTitle: string;
  tasks: ExecutionTask[];
};

export type ExecutionPlan = {
  summary: string;
  features: ExecutionPlanFeature[];
};

export type PlanJobStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "CANCELLED";
export type PlanFeatureStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "CANCELLED";

export type PlanJobFeature = ExecutionPlanFeature & {
  status: PlanFeatureStatus;
  error?: string;
};

export type StartGeneratePlanJobInput = {
  workspaceId: string;
  projectName: string;
  idea: string;
  generationMode: GenerationMode;
  productVision: ProductVision;
  selectedFeatures: ProductFeature[];
};

export type StartGeneratePlanJobResponse = {
  jobId: string;
  status: PlanJobStatus;
};

export type GeneratePlanJob = {
  id: string;
  status: PlanJobStatus;
  totalFeatures: number;
  completedFeatures: number;
  progress: number;
  currentFeatureId: string | null;
  currentFeatureTitle: string | null;
  pendingFeatures: PlanJobFeature[];
  processingFeature: PlanJobFeature | null;
  completedFeaturesList: PlanJobFeature[];
  failedFeatures: PlanJobFeature[];
  resultPlan: ExecutionPlan | null;
  error: string | null;
};

export type CreateProjectFromIdeaInput = {
  idea: ProjectIdeaInput;
  vision: ProductVision;
  plan: ExecutionPlan;
};

export type CreatedProjectFromIdea = {
  project: Project;
  taskCount: number;
};
