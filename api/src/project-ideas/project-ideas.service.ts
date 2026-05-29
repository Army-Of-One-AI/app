/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  Prisma,
  ProjectIdeaPlanJob,
  ProjectIdeaPlanJobStatus,
  TaskPriority,
} from '../generated/prisma/client';
import { OllamaService } from '../model-providers/ollama.service';
import type { OllamaGenerationMode } from '../model-providers/ollama.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExpandProjectIdeaDto } from './dto/expand-project-idea.dto';
import { GenerateProjectPlanDto } from './dto/generate-project-plan.dto';
import { ProjectIdeaFeatureDto } from './dto/generate-project-plan.dto';
import { StartGeneratePlanJobDto } from './dto/start-generate-plan-job.dto';

type ProductFeaturePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type ProductFeatureStage = 'MVP' | 'V2' | 'Future';

type ProductFeature = {
  id: string;
  title: string;
  summary: string;
  domain: string;
  priority: ProductFeaturePriority;
  stage: ProductFeatureStage;
};

type ProductFeatureGroups = {
  mvp: ProductFeature[];
  v2: ProductFeature[];
  future: ProductFeature[];
};

type ProductVision = {
  vision: string;
  goals: string[];
  targetUsers: string[];
  userStories: string[];
  domains: string[];
  features: ProductFeatureGroups;
  roadmap: string[];
};

type ExecutionTask = {
  title: string;
  description: string;
  priority: TaskPriority;
  acceptanceCriteria: string;
  suggestedRole: 'PM' | 'DESIGNER' | 'DEVELOPER' | 'QC';
};

type ExecutionPlanFeature = {
  featureId: string;
  featureTitle: string;
  tasks: ExecutionTask[];
};

type ExecutionPlan = {
  summary: string;
  features: ExecutionPlanFeature[];
};

type FeaturePlanStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED';

type JobPlanFeature = ExecutionPlanFeature & {
  status: FeaturePlanStatus;
  error?: string;
};

type JobResultPlan = {
  summary: string;
  features: JobPlanFeature[];
};

type GeneratePlanJobResponse = {
  jobId: string;
  status: ProjectIdeaPlanJobStatus;
};

type GeneratePlanJobStatusResponse = {
  id: string;
  status: ProjectIdeaPlanJobStatus;
  totalFeatures: number;
  completedFeatures: number;
  progress: number;
  currentFeatureId: string | null;
  currentFeatureTitle: string | null;
  pendingFeatures: JobPlanFeature[];
  processingFeature: JobPlanFeature | null;
  completedFeaturesList: JobPlanFeature[];
  failedFeatures: JobPlanFeature[];
  resultPlan: ExecutionPlan | null;
  error: string | null;
};

const PRODUCT_OWNER_SYSTEM_PROMPT =
  'You are the Product Owner agent for an AI software-building workspace. Think like a senior startup co-founder, product strategist, and roadmap planner. Expand a rough idea by identifying product type, user types, business domains, capabilities per domain, features per capability, prioritization, and roadmap. Return strict JSON only.';

const PM_SYSTEM_PROMPT =
  'You are the PM agent for an AI software-building workspace. Your job is to convert selected product features into executable Kanban tasks. For each feature, generate requirements, design, implementation, and QA tasks. Each task must include title, description, priority, acceptanceCriteria, and suggestedRole. Return strict JSON only.';

const productPriorities: ProductFeaturePriority[] = [
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
];
const suggestedRoles = ['PM', 'DESIGNER', 'DEVELOPER', 'QC'];
const productVisionOptionalArrayFields = [
  'goals',
  'targetUsers',
  'userStories',
  'domains',
  'roadmap',
] as const;

type ProductVisionOptionalArrayField =
  (typeof productVisionOptionalArrayFields)[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function isProductPriority(value: unknown): value is ProductFeaturePriority {
  return (
    typeof value === 'string' &&
    productPriorities.includes(value as ProductFeaturePriority)
  );
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return (
    typeof value === 'string' &&
    Object.values(TaskPriority).includes(value as TaskPriority)
  );
}

function isSuggestedRole(
  value: unknown,
): value is ExecutionTask['suggestedRole'] {
  return typeof value === 'string' && suggestedRoles.includes(value);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

@Injectable()
export class ProjectIdeasService {
  constructor(
    private readonly ollamaService: OllamaService,
    private readonly prisma: PrismaService,
  ) {}

  async expand(dto: ExpandProjectIdeaDto): Promise<ProductVision> {
    const generationMode = dto.generationMode ?? 'FAST';
    const output = await this.ollamaService.chatJson(
      [
        { role: 'system', content: PRODUCT_OWNER_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            'Return JSON with this exact shape:',
            '{ "vision": string, "goals": string[], "targetUsers": string[], "userStories": string[], "domains": string[], "features": { "mvp": [{ "id": string, "title": string, "summary": string, "domain": string, "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW", "stage": "MVP" }], "v2": [{ "id": string, "title": string, "summary": string, "domain": string, "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW", "stage": "V2" }], "future": [{ "id": string, "title": string, "summary": string, "domain": string, "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW", "stage": "Future" }] }, "roadmap": string[] }',
            `Generation mode: ${generationMode}`,
            `Project name: ${dto.projectName}`,
            `Idea: ${dto.idea}`,
            `Target audience: ${dto.targetAudience ?? 'not specified'}`,
            `Goals: ${dto.goals ?? 'not specified'}`,
            'IMPORTANT: Use lowercase feature group keys exactly: mvp, v2, future.',
            'Do not use MVP, V1, v1, mvpFeatures, v2Features, futureFeatures, or a flat features array.',
            'Use only these exact priority values: "CRITICAL", "HIGH", "MEDIUM", "LOW".',
            this.productOwnerModeInstructions(generationMode),
            'Use business domains such as Authentication, Marketplace, Payments, Analytics, Administration, Notifications, Search, Collaboration, Content, Integrations, Trust, Communication, or more specific domains appropriate to the product.',
            'Return compact strict JSON only. Do not include markdown.',
          ].join('\n'),
        },
      ],
      { role: 'PRODUCT_OWNER', generationMode },
    );
    return this.validateProductVision(output);
  }

  async generatePlan(dto: GenerateProjectPlanDto): Promise<ExecutionPlan> {
    const generationMode = dto.generationMode ?? 'FAST';
    const output = await this.ollamaService.chatJson(
      [
        { role: 'system', content: PM_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            'Return JSON with this exact shape:',
            '{ "summary": string, "features": [{ "featureId": string, "featureTitle": string, "tasks": [{ "title": string, "description": string, "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT", "acceptanceCriteria": string, "suggestedRole": "PM" | "DESIGNER" | "DEVELOPER" | "QC" }] }] }',
            `Generation mode: ${generationMode}`,
            'Selected features include title, summary, domain, priority, and stage:',
            JSON.stringify(dto.features),
            this.pmModeInstructions(generationMode),
            'Use the feature domain, priority, and stage to make task descriptions specific. Return compact strict JSON only. Do not include markdown.',
          ].join('\n'),
        },
      ],
      { role: 'PM', generationMode },
    );

    return this.validateExecutionPlan(output);
  }

  async startGeneratePlanJob(
    dto: StartGeneratePlanJobDto,
  ): Promise<GeneratePlanJobResponse> {
    const generationMode = dto.generationMode ?? 'FAST';
    const resultPlan = this.createInitialJobResultPlan(dto.selectedFeatures);
    const job = await this.prisma.projectIdeaPlanJob.create({
      data: {
        workspace_id: dto.workspaceId,
        project_name: dto.projectName,
        idea: dto.idea,
        generation_mode: generationMode,
        total_features: dto.selectedFeatures.length,
        product_vision: this.toJsonInput(dto.productVision),
        selected_features: this.toJsonInput(dto.selectedFeatures),
        result_plan: this.toJsonInput(resultPlan),
      },
    });

    return { jobId: job.id, status: job.status };
  }

  async getGeneratePlanJob(
    jobId: string,
  ): Promise<GeneratePlanJobStatusResponse> {
    const job = await this.prisma.projectIdeaPlanJob.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new BadRequestException('Plan generation job not found.');
    return this.toJobStatusResponse(job);
  }

  async cancelGeneratePlanJob(
    jobId: string,
  ): Promise<GeneratePlanJobStatusResponse> {
    const job = await this.prisma.projectIdeaPlanJob.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new BadRequestException('Plan generation job not found.');

    if (
      job.status === ProjectIdeaPlanJobStatus.PENDING ||
      job.status === ProjectIdeaPlanJobStatus.RUNNING
    ) {
      const resultPlan = this.getJobResultPlan(job);
      const updatedPlan: JobResultPlan = {
        ...resultPlan,
        features: resultPlan.features.map((feature) =>
          feature.status === 'PENDING' || feature.status === 'RUNNING'
            ? { ...feature, status: 'CANCELLED' }
            : feature,
        ),
      };
      const updatedJob = await this.prisma.projectIdeaPlanJob.update({
        where: { id: jobId },
        data: {
          status: ProjectIdeaPlanJobStatus.CANCELLED,
          result_plan: this.toJsonInput(updatedPlan),
          current_feature_id: null,
          current_feature_title: null,
          finished_at: new Date(),
        },
      });
      return this.toJobStatusResponse(updatedJob);
    }

    return this.toJobStatusResponse(job);
  }

  @Cron('*/3 * * * * *')
  async processPendingJobs() {
    const pendingJob = await this.prisma.projectIdeaPlanJob.findFirst({
      where: { status: ProjectIdeaPlanJobStatus.PENDING },
      orderBy: { created_at: 'asc' },
    });
    if (!pendingJob) return;

    const claimed = await this.prisma.projectIdeaPlanJob.updateMany({
      where: {
        id: pendingJob.id,
        status: ProjectIdeaPlanJobStatus.PENDING,
      },
      data: {
        status: ProjectIdeaPlanJobStatus.RUNNING,
        started_at: new Date(),
        error: null,
      },
    });
    if (claimed.count !== 1) return;

    const job = await this.prisma.projectIdeaPlanJob.findUnique({
      where: { id: pendingJob.id },
    });
    if (!job) return;

    await this.processJob(job);
  }

  private productOwnerModeInstructions(mode: OllamaGenerationMode) {
    if (mode === 'DEEP') {
      return [
        'DEEP mode: generate a broader roadmap while keeping summaries concise.',
        'Generate at least 15 MVP features, at least 10 V2 features, and at least 5 Future features.',
        'Target 25 to 40 total features.',
      ].join('\n');
    }

    return [
      'FAST mode: optimize for local Ollama speed.',
      'Be concise. Return compact JSON. Do not over-explain.',
      'Generate 8 to 12 MVP features, 4 to 6 V2 features, and 2 to 3 Future features.',
      'Generate only the requested number of features.',
    ].join('\n');
  }

  private pmModeInstructions(mode: OllamaGenerationMode) {
    if (mode === 'DEEP') {
      return 'DEEP mode: create complete but concise requirements, design, implementation, and QA tasks for each selected feature. Complex features may include separate backend and frontend implementation tasks.';
    }

    return 'FAST mode: generate only tasks for selected features. Create 3 to 5 concise tasks per feature with concise acceptance criteria.';
  }

  private async processJob(job: ProjectIdeaPlanJob) {
    let currentJob = job;
    let resultPlan = this.getJobResultPlan(currentJob);

    for (const feature of resultPlan.features) {
      currentJob = await this.reloadJobOrThrow(currentJob.id);
      if (currentJob.status === ProjectIdeaPlanJobStatus.CANCELLED) return;
      if (feature.status !== 'PENDING') continue;

      resultPlan = this.markFeature(resultPlan, feature.featureId, {
        status: 'RUNNING',
      });
      await this.prisma.projectIdeaPlanJob.update({
        where: { id: currentJob.id },
        data: {
          current_feature_id: feature.featureId,
          current_feature_title: feature.featureTitle,
          result_plan: this.toJsonInput(resultPlan),
        },
      });

      try {
        const selectedFeature = this.findSelectedFeature(
          currentJob,
          feature.featureId,
        );
        const featurePlan = await this.generatePlanForFeature(
          currentJob,
          selectedFeature,
        );
        if (await this.jobIsCancelled(currentJob.id)) return;
        resultPlan = this.markFeature(resultPlan, feature.featureId, {
          status: 'SUCCESS',
          tasks: featurePlan.tasks,
          error: undefined,
        });
      } catch (error) {
        if (await this.jobIsCancelled(currentJob.id)) return;
        resultPlan = this.markFeature(resultPlan, feature.featureId, {
          status: 'FAILED',
          error: this.errorMessage(error),
        });
      }

      const processedCount = resultPlan.features.filter((item) =>
        ['SUCCESS', 'FAILED', 'CANCELLED'].includes(item.status),
      ).length;

      await this.prisma.projectIdeaPlanJob.update({
        where: { id: currentJob.id },
        data: {
          completed_features: processedCount,
          current_feature_id: null,
          current_feature_title: null,
          result_plan: this.toJsonInput(resultPlan),
        },
      });
    }

    const successCount = resultPlan.features.filter(
      (feature) => feature.status === 'SUCCESS',
    ).length;
    if (await this.jobIsCancelled(currentJob.id)) return;
    await this.prisma.projectIdeaPlanJob.update({
      where: { id: currentJob.id },
      data: {
        status:
          successCount > 0
            ? ProjectIdeaPlanJobStatus.SUCCESS
            : ProjectIdeaPlanJobStatus.FAILED,
        error:
          successCount > 0
            ? null
            : 'No selected features were planned successfully.',
        completed_features: resultPlan.features.length,
        current_feature_id: null,
        current_feature_title: null,
        result_plan: this.toJsonInput(resultPlan),
        finished_at: new Date(),
      },
    });
  }

  private async reloadJobOrThrow(jobId: string) {
    const job = await this.prisma.projectIdeaPlanJob.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new BadRequestException('Plan generation job not found.');
    return job;
  }

  private async jobIsCancelled(jobId: string) {
    const job = await this.prisma.projectIdeaPlanJob.findUnique({
      where: { id: jobId },
      select: { status: true },
    });
    return job?.status === ProjectIdeaPlanJobStatus.CANCELLED;
  }

  private async generatePlanForFeature(
    job: ProjectIdeaPlanJob,
    feature: ProductFeature,
  ): Promise<ExecutionPlanFeature> {
    const generationMode = this.normalizeGenerationMode(job.generation_mode);
    const output = await this.ollamaService.chatJson(
      [
        { role: 'system', content: PM_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            'Return JSON with this exact shape:',
            '{ "featureId": string, "featureTitle": string, "tasks": [{ "title": string, "description": string, "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT", "acceptanceCriteria": string, "suggestedRole": "PM" | "DESIGNER" | "DEVELOPER" | "QC" }] }',
            `Generation mode: ${generationMode}`,
            `Product vision summary: ${this.productVisionSummary(job.product_vision)}`,
            'Selected feature:',
            JSON.stringify(feature),
            generationMode === 'DEEP'
              ? 'Generate 5 to 8 concise Kanban-ready tasks for this feature.'
              : 'Generate 3 to 5 concise Kanban-ready tasks for this feature.',
            'Include requirements, design, implementation, and QA coverage where appropriate. Return compact strict JSON only. Do not include markdown.',
          ].join('\n'),
        },
      ],
      { role: 'PM', generationMode },
    );

    return this.validatePlanFeature(output, 0);
  }

  private createInitialJobResultPlan(
    features: ProjectIdeaFeatureDto[],
  ): JobResultPlan {
    return {
      summary: 'Generating PM execution plan feature by feature.',
      features: features.map((feature) => ({
        featureId: feature.id,
        featureTitle: feature.title,
        status: 'PENDING',
        tasks: [],
      })),
    };
  }

  private markFeature(
    plan: JobResultPlan,
    featureId: string,
    update: Partial<JobPlanFeature>,
  ): JobResultPlan {
    return {
      ...plan,
      features: plan.features.map((feature) =>
        feature.featureId === featureId ? { ...feature, ...update } : feature,
      ),
    };
  }

  private toJobStatusResponse(
    job: ProjectIdeaPlanJob,
  ): GeneratePlanJobStatusResponse {
    const resultPlan = this.getJobResultPlan(job);
    const pendingFeatures = resultPlan.features.filter(
      (feature) => feature.status === 'PENDING',
    );
    const processingFeature =
      resultPlan.features.find((feature) => feature.status === 'RUNNING') ??
      null;
    const completedFeaturesList = resultPlan.features.filter(
      (feature) => feature.status === 'SUCCESS',
    );
    const failedFeatures = resultPlan.features.filter(
      (feature) => feature.status === 'FAILED',
    );
    const progress =
      job.total_features > 0
        ? Math.round((job.completed_features / job.total_features) * 100)
        : 0;

    return {
      id: job.id,
      status: job.status,
      totalFeatures: job.total_features,
      completedFeatures: job.completed_features,
      progress,
      currentFeatureId: job.current_feature_id,
      currentFeatureTitle: job.current_feature_title,
      pendingFeatures,
      processingFeature,
      completedFeaturesList,
      failedFeatures,
      resultPlan:
        job.status === ProjectIdeaPlanJobStatus.SUCCESS
          ? this.toExecutionPlan(resultPlan)
          : null,
      error: job.error,
    };
  }

  private toExecutionPlan(plan: JobResultPlan): ExecutionPlan {
    return {
      summary: plan.summary,
      features: plan.features
        .filter((feature) => feature.status === 'SUCCESS')
        .map((feature) => ({
          featureId: feature.featureId,
          featureTitle: feature.featureTitle,
          tasks: feature.tasks,
        })),
    };
  }

  private getJobResultPlan(job: ProjectIdeaPlanJob): JobResultPlan {
    if (this.isJobResultPlan(job.result_plan)) return job.result_plan;
    const features = this.getSelectedFeatures(job).map((feature) => ({
      featureId: feature.id,
      featureTitle: feature.title,
      status: 'PENDING' as const,
      tasks: [],
    }));
    return {
      summary: 'Generating PM execution plan feature by feature.',
      features,
    };
  }

  private isJobResultPlan(value: unknown): value is JobResultPlan {
    if (!isRecord(value) || typeof value.summary !== 'string') return false;
    if (!Array.isArray(value.features)) return false;
    return value.features.every((feature) => {
      if (!isRecord(feature)) return false;
      return (
        typeof feature.featureId === 'string' &&
        typeof feature.featureTitle === 'string' &&
        typeof feature.status === 'string' &&
        Array.isArray(feature.tasks)
      );
    });
  }

  private findSelectedFeature(
    job: ProjectIdeaPlanJob,
    featureId: string,
  ): ProductFeature {
    const feature = this.getSelectedFeatures(job).find(
      (item) => item.id === featureId,
    );
    if (!feature) {
      throw new BadRequestException(`Selected feature ${featureId} not found.`);
    }
    return feature;
  }

  private getSelectedFeatures(job: ProjectIdeaPlanJob): ProductFeature[] {
    const value = job.selected_features;
    if (!Array.isArray(value)) return [];
    return value.map((item, index) =>
      this.validateSelectedFeature(item, index),
    );
  }

  private validateSelectedFeature(
    item: unknown,
    index: number,
  ): ProductFeature {
    if (!isRecord(item)) {
      throw new BadRequestException(
        `Selected feature ${index + 1} must be an object.`,
      );
    }
    const stage = this.normalizeStage(item.stage) ?? 'MVP';
    return this.validateFeature(item, index, stage);
  }

  private productVisionSummary(value: Prisma.JsonValue) {
    if (!isRecord(value)) return '';
    const vision = stringValue(value.vision);
    const goals = Array.isArray(value.goals)
      ? value.goals.filter((goal): goal is string => typeof goal === 'string')
      : [];
    return [vision, ...goals].filter(Boolean).join(' ');
  }

  private normalizeGenerationMode(value: string): OllamaGenerationMode {
    return value === 'DEEP' ? 'DEEP' : 'FAST';
  }

  private toJsonInput(value: unknown): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }

  private errorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Unknown generation error.';
  }

  private validateProductVision(output: unknown): ProductVision {
    if (!isRecord(output)) {
      throw new BadRequestException(
        'Product Owner output must be a JSON object.',
      );
    }
    this.logRawProductOwnerOutput(output);
    const vision = stringValue(output.vision);
    if (!vision) {
      throw new BadRequestException('Product Owner output is missing vision.');
    }
    const optionalArrays = this.normalizeProductVisionOptionalArrays(output);
    const normalizedFeatures = this.normalizeFeatureGroups(output);
    this.logNormalizedFeatureCounts(normalizedFeatures);
    this.ensureUsableFeatureGroups(normalizedFeatures);
    const features = this.validateFeatureGroups(normalizedFeatures);

    return {
      vision,
      goals: optionalArrays.goals,
      targetUsers: optionalArrays.targetUsers,
      userStories: optionalArrays.userStories,
      domains: optionalArrays.domains,
      roadmap: optionalArrays.roadmap,
      features,
    };
  }

  private normalizeProductVisionOptionalArrays(
    output: Record<string, unknown>,
  ): Pick<
    ProductVision,
    ProductVisionOptionalArrayField
  > {
    const missingOrInvalidFields: ProductVisionOptionalArrayField[] = [];
    const normalized = productVisionOptionalArrayFields.reduce(
      (result, field) => {
        const value = output[field];
        if (isStringArray(value)) {
          result[field] = value;
          return result;
        }
        missingOrInvalidFields.push(field);
        result[field] = [];
        return result;
      },
      {} as Pick<ProductVision, ProductVisionOptionalArrayField>,
    );

    this.logMissingOptionalProductVisionArrays(missingOrInvalidFields);
    return normalized;
  }

  private normalizeFeatureGroups(output: Record<string, unknown>) {
    const explicitGroups = this.collectExplicitFeatureGroups(output);
    if (
      explicitGroups.mvp.length ||
      explicitGroups.v2.length ||
      explicitGroups.future.length
    ) {
      return this.rebalanceEmptyMvp(explicitGroups);
    }

    const flatFeatures = this.collectFlatFeatures(output);
    return this.rebalanceEmptyMvp(this.groupFlatFeatures(flatFeatures));
  }

  private collectExplicitFeatureGroups(output: Record<string, unknown>) {
    const groups: Record<keyof ProductFeatureGroups, unknown[]> = {
      mvp: [],
      v2: [],
      future: [],
    };

    const collect = (key: string, value: unknown) => {
      const stage = this.normalizeStage(key);
      if (!stage) return;
      const groupKey = this.groupKeyFromStage(stage);
      groups[groupKey] = [...groups[groupKey], ...arrayValue(value)];
    };

    if (isRecord(output.features)) {
      Object.entries(output.features).forEach(([key, value]) =>
        collect(key, value),
      );
    }

    Object.entries(output).forEach(([key, value]) => collect(key, value));
    return groups;
  }

  private collectFlatFeatures(output: Record<string, unknown>) {
    if (Array.isArray(output.features)) return output.features;
    return ['featureList', 'featureIdeas', 'roadmapFeatures'].flatMap((key) =>
      arrayValue(output[key]),
    );
  }

  private groupFlatFeatures(features: unknown[]) {
    const groups: Record<keyof ProductFeatureGroups, unknown[]> = {
      mvp: [],
      v2: [],
      future: [],
    };

    features.forEach((feature, index) => {
      const stage = isRecord(feature)
        ? this.normalizeStage(feature.stage ?? feature.phase ?? feature.release)
        : undefined;
      const fallbackStage = index < 15 ? 'MVP' : index < 25 ? 'V2' : 'Future';
      groups[this.groupKeyFromStage(stage ?? fallbackStage)].push(feature);
    });

    return groups;
  }

  private rebalanceEmptyMvp(
    groups: Record<keyof ProductFeatureGroups, unknown[]>,
  ) {
    if (groups.mvp.length > 0) return groups;

    const candidates = [...groups.v2, ...groups.future];
    if (candidates.length === 0) return groups;
    const mvpCount = Math.min(15, Math.max(10, candidates.length));

    return {
      mvp: candidates.slice(0, mvpCount),
      v2: candidates.slice(mvpCount, mvpCount + 10),
      future: candidates.slice(mvpCount + 10),
    };
  }

  private ensureUsableFeatureGroups(
    groups: Record<keyof ProductFeatureGroups, unknown[]>,
  ) {
    const total = groups.mvp.length + groups.v2.length + groups.future.length;
    if (total === 0) {
      throw new BadRequestException(
        'Product Owner output did not include any usable features.',
      );
    }
  }

  private validateFeatureGroups(
    features: Record<keyof ProductFeatureGroups, unknown[]>,
  ) {
    return {
      mvp: this.validateFeatureArray(features.mvp, 'MVP'),
      v2: this.validateFeatureArray(features.v2, 'V2'),
      future: this.validateFeatureArray(features.future, 'Future'),
    };
  }

  private validateFeatureArray(value: unknown, stage: ProductFeatureStage) {
    return arrayValue(value).map((item, index) =>
      this.validateFeature(item, index, stage),
    );
  }

  private validateFeature(
    item: unknown,
    index: number,
    expectedStage: ProductFeatureStage,
  ): ProductFeature {
    if (!isRecord(item)) {
      throw new BadRequestException(
        `${expectedStage} feature ${index + 1} must be an object.`,
      );
    }
    const title = stringValue(item.title ?? item.name ?? item.feature);
    if (!title) {
      throw new BadRequestException(
        `${expectedStage} feature ${index + 1} is missing title.`,
      );
    }
    const summary = stringValue(
      item.summary ?? item.description ?? item.valueProposition,
    );
    if (!summary) {
      throw new BadRequestException(
        `${expectedStage} feature ${index + 1} is missing summary.`,
      );
    }
    const originalPriority = item.priority ?? item.importance ?? item.urgency;
    const priority = this.normalizePriority(
      originalPriority,
      this.priorityFallbackForStage(expectedStage),
    );
    this.logPriorityNormalization({
      title,
      originalPriority,
      normalizedPriority: priority,
    });
    if (!isProductPriority(priority)) {
      throw new BadRequestException(
        `${expectedStage} feature ${index + 1} has an invalid priority.`,
      );
    }
    const modelStage = item.stage ?? item.phase ?? item.release;
    if (modelStage !== undefined && !this.normalizeStage(modelStage)) {
      throw new BadRequestException(
        `${expectedStage} feature ${index + 1} has an invalid stage.`,
      );
    }
    const domain = stringValue(item.domain ?? item.businessDomain) ?? 'Product';

    return {
      id: stringValue(item.id) ?? slugify(title),
      title,
      summary,
      domain,
      priority,
      stage: expectedStage,
    };
  }

  private normalizeStage(value: unknown): ProductFeatureStage | undefined {
    const raw = stringValue(value);
    if (!raw) return undefined;
    const normalized = normalizeKey(raw);
    if (
      [
        'mvp',
        'mvpfeatures',
        'v1',
        'v1features',
        'version1',
        'musthave',
        'core',
        'now',
      ].includes(normalized)
    ) {
      return 'MVP';
    }
    if (['v2', 'v2features', 'version2', 'next'].includes(normalized))
      return 'V2';
    if (
      ['future', 'futurefeatures', 'someday', 'nicetohave'].includes(normalized)
    ) {
      return 'Future';
    }
    if (normalized === 'later') return 'V2';
    return undefined;
  }

  private groupKeyFromStage(
    stage: ProductFeatureStage,
  ): keyof ProductFeatureGroups {
    if (stage === 'MVP') return 'mvp';
    if (stage === 'V2') return 'v2';
    return 'future';
  }

  private normalizePriority(
    value: unknown,
    fallback: ProductFeaturePriority,
  ): ProductFeaturePriority {
    const raw = stringValue(value);
    if (!raw) return fallback;
    const normalized = normalizeKey(raw);
    if (
      [
        'critical',
        'urgent',
        'musthave',
        'required',
        'essential',
        'p0',
        'blocker',
      ].includes(normalized)
    ) {
      return 'CRITICAL';
    }
    if (['high', 'important', 'highpriority', 'p1'].includes(normalized)) {
      return 'HIGH';
    }
    if (
      ['medium', 'normal', 'standard', 'shouldhave', 'p2'].includes(normalized)
    ) {
      return 'MEDIUM';
    }
    if (['low', 'optional', 'nicetohave', 'later', 'p3'].includes(normalized)) {
      return 'LOW';
    }
    return fallback;
  }

  private priorityFallbackForStage(
    stage: ProductFeatureStage,
  ): ProductFeaturePriority {
    if (stage === 'MVP') return 'HIGH';
    if (stage === 'V2') return 'MEDIUM';
    return 'LOW';
  }

  private logPriorityNormalization({
    title,
    originalPriority,
    normalizedPriority,
  }: {
    title: string;
    originalPriority: unknown;
    normalizedPriority: ProductFeaturePriority;
  }) {
    if (process.env.NODE_ENV === 'production') return;
    console.debug('ProjectIdeas Product Owner priority normalization:', {
      title,
      originalPriority,
      normalizedPriority,
    });
  }

  private logRawProductOwnerOutput(output: unknown) {
    if (process.env.NODE_ENV === 'production') return;
    console.debug('ProjectIdeas Product Owner raw output:', output);
  }

  private logNormalizedFeatureCounts(
    groups: Record<keyof ProductFeatureGroups, unknown[]>,
  ) {
    if (process.env.NODE_ENV === 'production') return;
    console.debug('ProjectIdeas Product Owner normalized feature counts:', {
      mvp: groups.mvp.length,
      v2: groups.v2.length,
      future: groups.future.length,
    });
  }

  private logMissingOptionalProductVisionArrays(
    fields: ProductVisionOptionalArrayField[],
  ) {
    if (process.env.NODE_ENV === 'production' || fields.length === 0) return;
    console.debug('ProjectIdeas Product Owner optional arrays defaulted:', {
      fields,
    });
  }

  private validateExecutionPlan(output: unknown): ExecutionPlan {
    if (!isRecord(output)) {
      throw new BadRequestException('PM output must be a JSON object.');
    }
    if (typeof output.summary !== 'string') {
      throw new BadRequestException('PM output is missing summary.');
    }
    if (!Array.isArray(output.features) || output.features.length === 0) {
      throw new BadRequestException('PM output must include planned features.');
    }

    return {
      summary: output.summary,
      features: output.features.map((item, index) =>
        this.validatePlanFeature(item, index),
      ),
    };
  }

  private validatePlanFeature(
    item: unknown,
    index: number,
  ): ExecutionPlanFeature {
    if (!isRecord(item)) {
      throw new BadRequestException(
        `Planned feature ${index + 1} must be an object.`,
      );
    }
    if (typeof item.featureId !== 'string') {
      throw new BadRequestException(
        `Planned feature ${index + 1} is missing featureId.`,
      );
    }
    if (typeof item.featureTitle !== 'string') {
      throw new BadRequestException(
        `Planned feature ${index + 1} is missing featureTitle.`,
      );
    }
    if (!Array.isArray(item.tasks) || item.tasks.length === 0) {
      throw new BadRequestException(
        `Planned feature ${index + 1} must include tasks.`,
      );
    }

    return {
      featureId: item.featureId,
      featureTitle: item.featureTitle,
      tasks: item.tasks.map((task, taskIndex) =>
        this.validateExecutionTask(task, index, taskIndex),
      ),
    };
  }

  private validateExecutionTask(
    item: unknown,
    featureIndex: number,
    taskIndex: number,
  ): ExecutionTask {
    if (!isRecord(item)) {
      throw new BadRequestException(
        `Task ${taskIndex + 1} for feature ${featureIndex + 1} must be an object.`,
      );
    }
    if (
      typeof item.title !== 'string' ||
      typeof item.description !== 'string' ||
      typeof item.acceptanceCriteria !== 'string'
    ) {
      throw new BadRequestException(
        `Task ${taskIndex + 1} for feature ${featureIndex + 1} is missing required text fields.`,
      );
    }
    if (!isTaskPriority(item.priority)) {
      throw new BadRequestException(
        `Task ${taskIndex + 1} for feature ${featureIndex + 1} has an invalid priority.`,
      );
    }
    if (!isSuggestedRole(item.suggestedRole)) {
      throw new BadRequestException(
        `Task ${taskIndex + 1} for feature ${featureIndex + 1} has an invalid suggestedRole.`,
      );
    }

    return {
      title: item.title,
      description: item.description,
      priority: item.priority,
      acceptanceCriteria: item.acceptanceCriteria,
      suggestedRole: item.suggestedRole,
    };
  }
}
