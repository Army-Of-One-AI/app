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

export type PlanningDocuments = {
  prd: {
    title: string;
    overview: string;
    problemStatement: string;
    goals: string[];
    targetUsers: string[];
    userPersonas: string[];
    coreUserFlows: string[];
    functionalRequirements: string[];
    nonFunctionalRequirements: string[];
    permissions: string[];
    dataRequirements: string[];
    notifications: string[];
    edgeCases: string[];
    constraints: string[];
    nonGoals: string[];
    successMetrics: string[];
    featureRequirements: Array<{
      featureId: string;
      featureTitle: string;
      description: string;
      userValue: string;
      expectedBehavior: string[];
      dependencies: string[];
      edgeCases: string[];
      acceptanceCriteria: string[];
    }>;
  };
  mvpScope: {
    includedFeatures: string[];
    excludedFeatures: string[];
    buildOrder: string[];
    assumptions: string[];
    risks: string[];
    dependencies: string[];
    tradeoffs: string[];
    launchCriteria: string[];
  };
  userStories: Array<{
    featureId: string;
    featureTitle: string;
    stories: Array<{
      persona: string;
      story: string;
      acceptanceCriteria: string[];
      priority: ProductFeaturePriority;
    }>;
  }>;
  milestones: Array<{
    title: string;
    objective: string;
    featureIds: string[];
    dependencies: string[];
    outcome: string;
  }>;
  acceptanceRules: {
    uxRules: string[];
    securityRules: string[];
    performanceRules: string[];
    qualityRules: string[];
    errorHandlingRules: string[];
    releaseChecklist: string[];
    testingChecklist: string[];
  };
};

export type PlanJobStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "CANCELLED";
export type PlanFeatureStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "CANCELLED";
export type PlanJobPhase =
  | "GENERATING_PRD"
  | "GENERATING_MVP_SCOPE"
  | "GENERATING_USER_STORIES"
  | "GENERATING_MILESTONES"
  | "GENERATING_ACCEPTANCE_RULES"
  | "GENERATING_TASKS";

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
  currentPhase: PlanJobPhase | null;
  totalSteps: number;
  completedSteps: number;
  totalFeatures: number;
  completedFeatures: number;
  progress: number;
  currentItem: string | null;
  currentFeatureId: string | null;
  currentFeatureTitle: string | null;
  pendingItems: string[];
  completedItems: string[];
  failedItems: string[];
  pendingFeatures: PlanJobFeature[];
  processingFeature: PlanJobFeature | null;
  completedFeaturesList: PlanJobFeature[];
  failedFeatures: PlanJobFeature[];
  generatedDocuments: PlanningDocuments | null;
  resultPlan: ExecutionPlan | null;
  error: string | null;
};

export type CreateProjectFromIdeaInput = {
  idea: ProjectIdeaInput;
  vision: ProductVision;
  documents: PlanningDocuments;
  plan: ExecutionPlan;
};

export type CreatedProjectFromIdea = {
  project: Project;
  taskCount: number;
};
