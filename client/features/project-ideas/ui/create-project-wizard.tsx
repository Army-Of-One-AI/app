/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useModelProviders } from "@/features/model-providers/hooks/use-model-providers";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";
import {
  AppShell,
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  ErrorState,
  Field,
  GenerationLoadingCard,
  Input,
  Select,
  Skeleton,
  Textarea,
} from "@/shared/ui/components";
import {
  useCancelGeneratePlanJob,
  useCreateProjectFromIdea,
  useExpandProjectIdea,
  useGeneratePlanJob,
  useStartGeneratePlanJob,
} from "../hooks/use-project-ideas";
import type {
  GeneratePlanJob,
  GenerationMode,
  PlanningDocuments,
  PlanJobFeature,
  ProductFeature,
  ProductFeatureStage,
  ProjectIdeaInput,
  ProductVision,
} from "../types";

type WizardStep =
  | "idea"
  | "vision"
  | "features"
  | "planning"
  | "documents"
  | "tasks"
  | "create";

const steps: Array<{ id: WizardStep; label: string }> = [
  { id: "idea", label: "Idea Input" },
  { id: "vision", label: "Product Owner Review" },
  { id: "features", label: "Feature Selection" },
  { id: "planning", label: "Planning Job" },
  { id: "documents", label: "Review Documents" },
  { id: "tasks", label: "Review Tasks" },
  { id: "create", label: "Create Project" },
];

const defaultRoleModels = {
  productOwner: "qwen3:4b",
  pm: "qwen3:4b",
};

function useOllamaModelLabel(defaultModel: string) {
  const providers = useModelProviders();
  const configuredModel = providers.data?.find(
    (provider) => provider.type === "OLLAMA"
  )?.model_name;
  return configuredModel ?? defaultModel;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mutationErrorMessage(error: unknown, fallback: string) {
  if (!isRecord(error)) return fallback;
  const response = error.response;
  if (!isRecord(response))
    return error.message && typeof error.message === "string"
      ? error.message
      : fallback;
  const data = response.data;
  if (!isRecord(data)) return fallback;
  const message = data.message;
  if (typeof message === "string") return message;
  if (
    Array.isArray(message) &&
    message.every((item) => typeof item === "string")
  )
    return message.join(" ");
  return fallback;
}

function Stepper({ currentStep }: { currentStep: WizardStep }) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div className="grid gap-2 md:grid-cols-7">
      {steps.map((step, index) => {
        const active = step.id === currentStep;
        const complete = index < currentIndex;
        return (
          <div
            key={step.id}
            className={`rounded-xl border px-3 py-2 ${
              active
                ? "border-[#4F46E5] bg-[#EEF2FF]"
                : "border-[#E5E7EB] bg-white"
            }`}
          >
            <p
              className={`text-xs font-semibold ${
                complete || active ? "text-[#4F46E5]" : "text-[#6B7280]"
              }`}
            >
              {index + 1}
            </p>
            <p className="mt-1 text-sm font-medium text-[#111827]">
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function IdeaForm({
  input,
  onChange,
  onSubmit,
  isPending,
  productOwnerModel,
}: {
  input: ProjectIdeaInput;
  onChange: (input: ProjectIdeaInput) => void;
  onSubmit: () => void;
  isPending: boolean;
  productOwnerModel: string;
}) {
  const workspaces = useWorkspaces();

  return (
    <Card>
      <CardBody>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[#111827]">Project Idea</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Start with a rough idea. The Product Owner turns it into product
            direction.
          </p>
        </div>
        {workspaces.isError ? (
          <ErrorState message="Could not load workspaces." />
        ) : null}
        {workspaces.isLoading ? (
          <div
            role="status"
            aria-busy="true"
            aria-label="Loading workspaces"
            className="mb-4"
          >
            <Skeleton className="h-10 w-full" />
          </div>
        ) : null}
        {!workspaces.isLoading && workspaces.data?.length === 0 ? (
          <EmptyState
            title="Create a workspace first"
            description="Projects need a workspace before the idea can become a board."
          />
        ) : null}
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <Field label="Workspace">
            <Select
              value={input.workspaceId}
              onChange={(event) =>
                onChange({ ...input, workspaceId: event.target.value })
              }
            >
              <option value="">Select workspace</option>
              {workspaces.data?.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Project name">
            <Input
              value={input.projectName}
              onChange={(event) =>
                onChange({ ...input, projectName: event.target.value })
              }
              placeholder="Agent of One"
            />
          </Field>
          <Field label="Project idea">
            <Textarea
              value={input.idea}
              onChange={(event) =>
                onChange({ ...input, idea: event.target.value })
              }
              placeholder="A self-hosted AI software team for solo founders."
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Target audience">
              <Input
                value={input.targetAudience ?? ""}
                onChange={(event) =>
                  onChange({ ...input, targetAudience: event.target.value })
                }
                placeholder="solo founders, indie hackers"
              />
            </Field>
            <Field label="Goals">
              <Input
                value={input.goals ?? ""}
                onChange={(event) =>
                  onChange({ ...input, goals: event.target.value })
                }
                placeholder="reduce planning overhead, improve execution speed"
              />
            </Field>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-[#F7F8FC] p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#111827]">
                  Generation mode
                </p>
                <p className="mt-1 text-xs text-[#6B7280]">
                  Fast mode is recommended for local Ollama models.
                </p>
              </div>
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-1">
                {(["FAST", "DEEP"] as GenerationMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onChange({ ...input, generationMode: mode })}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      input.generationMode === mode
                        ? "bg-[#EEF2FF] text-[#4F46E5]"
                        : "text-[#6B7280] hover:text-[#111827]"
                    }`}
                  >
                    {mode === "FAST" ? "Fast" : "Deep"}
                  </button>
                ))}
              </div>
            </div>
            {input.generationMode === "DEEP" ? (
              <p className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-medium text-[#B45309]">
                Deep mode may take longer on local models depending on your
                machine.
              </p>
            ) : null}
            <p className="mt-3 text-xs font-medium text-[#6B7280]">
              Product Owner model: {productOwnerModel}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={
                isPending ||
                !input.workspaceId ||
                !input.projectName.trim() ||
                !input.idea.trim()
              }
            >
              {isPending ? "Generating" : "Generate Product Vision"}
            </Button>
            <Link href="/dashboard">
              <Button variant="ghost">Cancel</Button>
            </Link>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

function ProductOwnerReview({
  vision,
  selectedFeatureIds,
  onToggleFeature,
  onSelectStage,
  onGeneratePlan,
  onBack,
  isPending,
  generationMode,
  pmModel,
}: {
  vision: ProductVision;
  selectedFeatureIds: string[];
  onToggleFeature: (featureId: string) => void;
  onSelectStage: (stage: ProductFeatureStage) => void;
  onGeneratePlan: () => void;
  onBack: () => void;
  isPending: boolean;
  generationMode: GenerationMode;
  pmModel: string;
}) {
  const featureGroups: Array<{
    stage: ProductFeatureStage;
    title: string;
    features: ProductFeature[];
  }> = [
    {
      stage: "MVP",
      title: `MVP Features (${vision.features.mvp.length})`,
      features: vision.features.mvp,
    },
    {
      stage: "V2",
      title: `V2 Features (${vision.features.v2.length})`,
      features: vision.features.v2,
    },
    {
      stage: "Future",
      title: `Future Features (${vision.features.future.length})`,
      features: vision.features.future,
    },
  ];

  return (
    <div className="grid gap-4">
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="cyan">Product Owner</Badge>
            <h2 className="text-lg font-semibold text-[#111827]">
              Product Vision
            </h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#374151]">
            {vision.vision}
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ReviewList title="Goals" items={vision.goals} />
            <ReviewList title="Target users" items={vision.targetUsers} />
            <ReviewList title="Domains" items={vision.domains} />
            <ReviewList title="User stories" items={vision.userStories} />
          </div>
          <div className="mt-5">
            <ReviewList title="Roadmap" items={vision.roadmap} />
          </div>
        </CardBody>
      </Card>

      {featureGroups.map((group) => (
        <FeatureStageSection
          key={group.stage}
          title={group.title}
          stage={group.stage}
          features={group.features}
          selectedFeatureIds={selectedFeatureIds}
          onToggleFeature={onToggleFeature}
          onSelectStage={onSelectStage}
        />
      ))}

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={onGeneratePlan}
          disabled={isPending || selectedFeatureIds.length === 0}
        >
          {isPending ? "Generating" : "Generate PM Documents"}
        </Button>
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
      <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3">
        <p className="text-xs font-medium text-[#6B7280]">
          PM model: {pmModel}
        </p>
        <p className="mt-1 text-xs text-[#6B7280]">
          {generationMode === "FAST"
            ? "Fast mode keeps PM planning concise for local Ollama models."
            : "Deep mode may take longer on local models depending on your machine."}
        </p>
      </div>
    </div>
  );
}

function priorityTone(priority: ProductFeature["priority"] | "URGENT") {
  if (priority === "CRITICAL" || priority === "URGENT") return "pink";
  if (priority === "HIGH") return "amber";
  if (priority === "MEDIUM") return "cyan";
  return "slate";
}

function FeatureStageSection({
  title,
  stage,
  features,
  selectedFeatureIds,
  onToggleFeature,
  onSelectStage,
}: {
  title: string;
  stage: ProductFeatureStage;
  features: ProductFeature[];
  selectedFeatureIds: string[];
  onToggleFeature: (featureId: string) => void;
  onSelectStage: (stage: ProductFeatureStage) => void;
}) {
  const selectedCount = features.filter((featureItem) =>
    selectedFeatureIds.includes(featureItem.id)
  ).length;

  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
          <p className="mt-1 text-sm text-[#6B7280]">
            {selectedCount} selected
          </p>
        </div>
        <Button variant="ghost" onClick={() => onSelectStage(stage)}>
          Select all {stage}
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {features.map((featureItem) => {
          const selected = selectedFeatureIds.includes(featureItem.id);
          return (
            <button
              key={featureItem.id}
              type="button"
              onClick={() => onToggleFeature(featureItem.id)}
              className={`rounded-2xl border bg-white p-4 text-left transition ${
                selected
                  ? "border-[#4F46E5] ring-4 ring-[#4F46E5]/10"
                  : "border-[#E5E7EB] hover:border-[#4F46E5]/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#111827]">
                    {featureItem.title}
                  </p>
                  <p className="mt-2 text-sm text-[#6B7280]">
                    {featureItem.summary}
                  </p>
                </div>
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border text-sm ${
                    selected
                      ? "border-[#4F46E5] bg-[#4F46E5] text-white"
                      : "border-[#D1D5DB] text-white"
                  }`}
                >
                  {selected ? "✓" : ""}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone={priorityTone(featureItem.priority)}>
                  {featureItem.priority}
                </Badge>
                <Badge>{featureItem.domain}</Badge>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ReviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-normal text-[#6B7280]">
        {title}
      </p>
      <ul className="mt-2 grid gap-2">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-lg bg-[#F7F8FC] px-3 py-2 text-sm text-[#374151]"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function flattenFeatures(vision: ProductVision | undefined) {
  if (!vision) return [];
  return [
    ...vision.features.mvp,
    ...vision.features.v2,
    ...vision.features.future,
  ];
}

function featuresForStage(vision: ProductVision, stage: ProductFeatureStage) {
  if (stage === "MVP") return vision.features.mvp;
  if (stage === "V2") return vision.features.v2;
  return vision.features.future;
}

type DocumentTab =
  | "prd"
  | "mvpScope"
  | "userStories"
  | "milestones"
  | "acceptanceRules";

function PMDocumentsReview({
  job,
  onContinue,
  onBack,
  onCancel,
}: {
  job: GeneratePlanJob | undefined;
  onContinue: () => void;
  onBack: () => void;
  onCancel: () => void;
}) {
  const [activeTab, setActiveTab] = useState<DocumentTab>("prd");
  const documents = job?.generatedDocuments;
  const canReviewTasks = job?.status === "SUCCESS" && Boolean(documents);
  const phaseCopy = pmPhaseCopy(job);

  return (
    <div className="grid gap-4">
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="cyan">PM</Badge>
                <h2 className="text-lg font-semibold text-[#111827]">
                  {phaseCopy.title}
                </h2>
              </div>
              <p className="mt-2 text-sm text-[#6B7280]">
                {phaseCopy.subtitle}
              </p>
            </div>
            <Badge
              tone={
                job?.status === "FAILED"
                  ? "pink"
                  : job?.status === "SUCCESS"
                  ? "green"
                  : "amber"
              }
            >
              {statusLabel(job?.status)}
            </Badge>
          </div>
          <JobProgress job={job} />
        </CardBody>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <FeatureStatusGroup
          title="Processing"
          emptyLabel="Nothing is planning right now."
          features={job?.processingFeature ? [job.processingFeature] : []}
          tone="cyan"
        />
        <FeatureStatusGroup
          title="Pending"
          emptyLabel="No queued features."
          features={job?.pendingFeatures ?? []}
          tone="amber"
        />
        <FeatureStatusGroup
          title="Completed"
          emptyLabel="No completed features yet."
          features={job?.completedFeaturesList ?? []}
          tone="green"
        />
        <FeatureStatusGroup
          title="Failed"
          emptyLabel="No failed features."
          features={job?.failedFeatures ?? []}
          tone="pink"
        />
      </div>

      {documents ? (
        <Card>
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {documentTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                    activeTab === tab.id
                      ? "border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5]"
                      : "border-[#E5E7EB] bg-white text-[#374151]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="mt-5">
              <PlanningDocumentView
                documents={documents}
                activeTab={activeTab}
              />
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
            <p className="text-sm text-[#6B7280]">
              Planning documents will appear here when the PM finishes the
              document phase.
            </p>
          </CardBody>
        </Card>
      )}

      {job?.status === "FAILED" ? (
        <ErrorState
          message={job.error ?? "PM planning document generation failed."}
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button onClick={onContinue} disabled={!canReviewTasks}>
          Review PM Tasks
        </Button>
        {job?.status === "PENDING" || job?.status === "RUNNING" ? (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}

function PlanningJobReview({
  job,
  onCancel,
  onBack,
}: {
  job: GeneratePlanJob | undefined;
  onCancel: () => void;
  onBack: () => void;
}) {
  const phaseCopy = pmPhaseCopy(job);

  return (
    <div className="grid gap-4">
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="cyan">PM</Badge>
                <h2 className="text-lg font-semibold text-[#111827]">
                  PM is planning your project
                </h2>
              </div>
              <p className="mt-2 text-sm font-medium text-[#111827]">
                Current: {phaseCopy.title}
              </p>
              <p className="mt-1 text-sm text-[#6B7280]">
                {phaseCopy.subtitle}
              </p>
            </div>
            <Badge
              tone={
                job?.status === "FAILED"
                  ? "pink"
                  : job?.status === "SUCCESS"
                  ? "green"
                  : "amber"
              }
            >
              {statusLabel(job?.status)}
            </Badge>
          </div>
          <JobProgress job={job} />
        </CardBody>
      </Card>

      <div className="grid gap-3 lg:grid-cols-3">
        <PlanningItemGroup
          title="Completed"
          items={job?.completedItems ?? []}
          tone="green"
          emptyLabel="No completed items yet."
        />
        <PlanningItemGroup
          title="Processing"
          items={job?.currentItem ? [job.currentItem] : []}
          tone="cyan"
          emptyLabel="Waiting for the worker."
        />
        <PlanningItemGroup
          title="Pending"
          items={job?.pendingItems ?? []}
          tone="amber"
          emptyLabel="No pending items."
        />
      </div>

      {job?.status === "FAILED" ? (
        <ErrorState message={job.error ?? "Planning job failed."} />
      ) : null}
      {job?.status === "CANCELLED" ? (
        <EmptyState
          title="Planning job cancelled"
          description="Start a new planning job when you are ready."
        />
      ) : null}

      <Card>
        <CardBody>
          <div className="grid gap-2 text-sm text-[#6B7280]">
            <p>
              Documents are generated one at a time to keep local Ollama
              requests stable.
            </p>
            <p>
              Tasks are generated feature by feature after documents are
              complete.
            </p>
            <p>Tip: Fast mode is best for qwen3:4b on local machines.</p>
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-wrap gap-2">
        {job?.status === "PENDING" || job?.status === "RUNNING" ? (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}

function PlanningItemGroup({
  title,
  items,
  tone,
  emptyLabel,
}: {
  title: string;
  items: string[];
  tone: "cyan" | "amber" | "green" | "pink";
  emptyLabel: string;
}) {
  return (
    <Card>
      <CardBody>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-semibold text-[#111827]">{title}</h3>
          <Badge tone={tone}>{items.length}</Badge>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-[#6B7280]">{emptyLabel}</p>
        ) : (
          <div className="grid gap-2">
            {items.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FC] px-3 py-2 text-sm text-[#374151]"
              >
                {item}
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

const documentTabs: Array<{ id: DocumentTab; label: string }> = [
  { id: "prd", label: "PRD" },
  { id: "mvpScope", label: "MVP Scope" },
  { id: "userStories", label: "User Stories" },
  { id: "milestones", label: "Milestones" },
  { id: "acceptanceRules", label: "Acceptance Rules" },
];

function PlanningDocumentView({
  documents,
  activeTab,
}: {
  documents: PlanningDocuments;
  activeTab: DocumentTab;
}) {
  if (activeTab === "prd") {
    return (
      <div className="grid gap-4">
        <p className="text-sm leading-6 text-[#374151]">
          {documents.prd.overview || "No overview generated."}
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <ReviewList
            title="Problem"
            items={
              documents.prd.problemStatement
                ? [documents.prd.problemStatement]
                : []
            }
          />
          <ReviewList title="Goals" items={documents.prd.goals} />
          <ReviewList title="Users" items={documents.prd.targetUsers} />
          <ReviewList title="Personas" items={documents.prd.userPersonas} />
          <ReviewList title="Core Flows" items={documents.prd.coreUserFlows} />
          <ReviewList
            title="Functional Requirements"
            items={documents.prd.functionalRequirements}
          />
          <ReviewList
            title="Non Functional Requirements"
            items={documents.prd.nonFunctionalRequirements}
          />
          <ReviewList title="Permissions" items={documents.prd.permissions} />
          <ReviewList
            title="Data Requirements"
            items={documents.prd.dataRequirements}
          />
          <ReviewList
            title="Notifications"
            items={documents.prd.notifications}
          />
          <ReviewList title="Edge Cases" items={documents.prd.edgeCases} />
          <ReviewList title="Constraints" items={documents.prd.constraints} />
          <ReviewList title="Non-goals" items={documents.prd.nonGoals} />
          <ReviewList
            title="Success Metrics"
            items={documents.prd.successMetrics}
          />
        </div>
      </div>
    );
  }
  if (activeTab === "mvpScope") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <ReviewList
          title="Included"
          items={documents.mvpScope.includedFeatures}
        />
        <ReviewList
          title="Excluded"
          items={documents.mvpScope.excludedFeatures}
        />
        <ReviewList title="Build Order" items={documents.mvpScope.buildOrder} />
        <ReviewList
          title="Assumptions"
          items={documents.mvpScope.assumptions}
        />
        <ReviewList title="Risks" items={documents.mvpScope.risks} />
        <ReviewList
          title="Dependencies"
          items={documents.mvpScope.dependencies}
        />
        <ReviewList title="Tradeoffs" items={documents.mvpScope.tradeoffs} />
        <ReviewList
          title="Launch Criteria"
          items={documents.mvpScope.launchCriteria}
        />
      </div>
    );
  }
  if (activeTab === "userStories") {
    return (
      <div className="grid gap-3">
        {documents.userStories.map((feature) => (
          <div
            key={feature.featureId}
            className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FC] p-4"
          >
            <ReviewList
              title={feature.featureTitle}
              items={feature.stories.map(
                (story) => `${story.persona}: ${story.story}`
              )}
            />
          </div>
        ))}
      </div>
    );
  }
  if (activeTab === "milestones") {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {documents.milestones.map((milestone) => (
          <div
            key={milestone.title}
            className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FC] p-4"
          >
            <h3 className="font-semibold text-[#111827]">{milestone.title}</h3>
            <p className="mt-2 text-sm text-[#6B7280]">{milestone.objective}</p>
            <p className="mt-2 text-xs font-medium text-[#374151]">
              Outcome: {milestone.outcome}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {milestone.featureIds.map((featureId) => (
                <Badge key={featureId}>{featureId}</Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ReviewList title="UX Rules" items={documents.acceptanceRules.uxRules} />
      <ReviewList
        title="Security Rules"
        items={documents.acceptanceRules.securityRules}
      />
      <ReviewList
        title="Performance Rules"
        items={documents.acceptanceRules.performanceRules}
      />
      <ReviewList
        title="Quality Rules"
        items={documents.acceptanceRules.qualityRules}
      />
      <ReviewList
        title="Error Handling Rules"
        items={documents.acceptanceRules.errorHandlingRules}
      />
      <ReviewList
        title="Release Checklist"
        items={documents.acceptanceRules.releaseChecklist}
      />
      <ReviewList
        title="Testing Checklist"
        items={documents.acceptanceRules.testingChecklist}
      />
    </div>
  );
}

function pmPhaseCopy(job: GeneratePlanJob | undefined) {
  if (job?.currentPhase === "GENERATING_PRD")
    return {
      title: "Generating PRD",
      subtitle:
        "Defining requirements, user flows, constraints, and feature acceptance criteria.",
    };
  if (job?.currentPhase === "GENERATING_MVP_SCOPE")
    return {
      title: "Generating MVP Scope",
      subtitle:
        "Clarifying included features, exclusions, build order, assumptions, risks, and launch criteria.",
    };
  if (job?.currentPhase === "GENERATING_USER_STORIES")
    return {
      title: "Generating User Stories",
      subtitle:
        "Writing persona-based stories and acceptance criteria for each selected feature.",
    };
  if (job?.currentPhase === "GENERATING_MILESTONES")
    return {
      title: "Generating Milestones",
      subtitle:
        "Sequencing Foundation, Core Product, Advanced Features, and Launch Readiness.",
    };
  if (job?.currentPhase === "GENERATING_ACCEPTANCE_RULES")
    return {
      title: "Generating Acceptance Rules",
      subtitle:
        "Creating UX, security, performance, quality, release, and testing checklists.",
    };
  if (job?.currentPhase === "GENERATING_TASKS") {
    return {
      title: "PM is turning documents into Kanban tasks",
      subtitle:
        "Selected features are being converted into execution-ready tasks one by one.",
    };
  }
  return {
    title: "PM planning is queued",
    subtitle:
      "The PM will draft planning documents before creating Kanban tasks.",
  };
}

function JobProgress({ job }: { job: GeneratePlanJob | undefined }) {
  const currentItem = job?.currentItem ?? job?.currentFeatureTitle;
  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium text-[#111827]">
          Progress: {job?.completedSteps ?? 0} / {job?.totalSteps ?? 0} planning
          steps completed
        </span>
        <span className="text-[#6B7280]">{job?.progress ?? 0}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EEF2FF]">
        <div
          className="h-full rounded-full bg-[#4F46E5] transition-all"
          style={{ width: `${job?.progress ?? 0}%` }}
        />
      </div>
      {job?.currentPhase ? (
        <p className="mt-3 text-xs font-medium text-[#6B7280]">
          Current phase: {job.currentPhase.replaceAll("_", " ")}
        </p>
      ) : null}
      {currentItem ? (
        <p className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-sm text-[#0891B2]">
          Current item: {currentItem}
        </p>
      ) : null}
    </div>
  );
}

function PMPlanReview({
  job,
  onCreateProject,
  onBack,
  onCancel,
  onRetry,
  isPending,
}: {
  job: GeneratePlanJob | undefined;
  onCreateProject: () => void;
  onBack: () => void;
  onCancel: () => void;
  onRetry: () => void;
  isPending: boolean;
}) {
  const plan = job?.resultPlan;
  const documents = job?.generatedDocuments;
  const taskCount =
    plan?.features.reduce(
      (count, featureItem) => count + featureItem.tasks.length,
      0
    ) ?? 0;
  const canCreate =
    job?.status === "SUCCESS" &&
    Boolean(plan) &&
    Boolean(documents) &&
    taskCount > 0;
  const phaseCopy = pmPhaseCopy(job);

  return (
    <div className="grid gap-4">
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="cyan">PM</Badge>
                <h2 className="text-lg font-semibold text-[#111827]">
                  {phaseCopy.title}
                </h2>
              </div>
              <p className="mt-2 text-sm text-[#6B7280]">
                {phaseCopy.subtitle}
              </p>
            </div>
            <Badge
              tone={
                job?.status === "FAILED"
                  ? "pink"
                  : job?.status === "SUCCESS"
                  ? "green"
                  : "amber"
              }
            >
              {statusLabel(job?.status)}
            </Badge>
          </div>
          <JobProgress job={job} />
        </CardBody>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <FeatureStatusGroup
          title="Processing"
          emptyLabel="Nothing is planning right now."
          features={job?.processingFeature ? [job.processingFeature] : []}
          tone="cyan"
        />
        <FeatureStatusGroup
          title="Pending"
          emptyLabel="No queued features."
          features={job?.pendingFeatures ?? []}
          tone="amber"
        />
        <FeatureStatusGroup
          title="Completed"
          emptyLabel="No completed features yet."
          features={job?.completedFeaturesList ?? []}
          tone="green"
        />
        <FeatureStatusGroup
          title="Failed"
          emptyLabel="No failed features."
          features={job?.failedFeatures ?? []}
          tone="pink"
        />
      </div>

      <Card>
        <CardBody>
          <div className="grid gap-2 text-sm text-[#6B7280]">
            <p>
              Large plans are generated feature by feature so local models stay
              stable.
            </p>
            <p>You can review the tasks before creating the board.</p>
            <p>Local Ollama can take longer depending on your machine.</p>
          </div>
        </CardBody>
      </Card>

      {job?.status === "FAILED" ? (
        <ErrorState
          message={
            job.error ??
            "Execution plan generation failed. You can retry with a new job."
          }
        />
      ) : null}
      {job?.status === "CANCELLED" ? (
        <EmptyState
          title="Plan generation cancelled"
          description="Start a new job when you are ready to try again."
        />
      ) : null}

      {plan ? (
        <Card>
          <CardBody>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-[#111827]">Execution Plan</h3>
                <p className="mt-1 text-sm text-[#6B7280]">{plan.summary}</p>
              </div>
              <Badge tone="green">{taskCount} Backlog tasks</Badge>
            </div>
          </CardBody>
        </Card>
      ) : null}

      <div className="grid gap-3">
        {plan?.features.map((featureItem) => (
          <Card key={featureItem.featureId}>
            <CardBody>
              <h3 className="font-semibold text-[#111827]">
                {featureItem.featureTitle}
              </h3>
              <div className="mt-3 grid gap-2">
                {featureItem.tasks.map((task) => (
                  <div
                    key={task.title}
                    className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FC] p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#111827]">
                        {task.title}
                      </p>
                      <Badge tone={priorityTone(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-[#6B7280]">
                      {task.description}
                    </p>
                    <p className="mt-2 text-xs font-medium text-[#4F46E5]">
                      Suggested role: {task.suggestedRole.replaceAll("_", " ")}
                    </p>
                    <p className="mt-2 text-xs font-medium text-[#374151]">
                      Acceptance: {task.acceptanceCriteria}
                    </p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onCreateProject} disabled={isPending || !canCreate}>
          {isPending ? "Creating" : "Create Project Board"}
        </Button>
        {job?.status === "PENDING" || job?.status === "RUNNING" ? (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        {job?.status === "FAILED" || job?.status === "CANCELLED" ? (
          <Button variant="secondary" onClick={onRetry}>
            Retry failed generation
          </Button>
        ) : null}
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}

function statusLabel(status: GeneratePlanJob["status"] | undefined) {
  if (status === "PENDING") return "Waiting";
  if (status === "RUNNING") return "Planning now";
  if (status === "SUCCESS") return "Ready";
  if (status === "FAILED") return "Needs retry";
  if (status === "CANCELLED") return "Cancelled";
  return "Waiting";
}

function FeatureStatusGroup({
  title,
  emptyLabel,
  features,
  tone,
}: {
  title: string;
  emptyLabel: string;
  features: PlanJobFeature[];
  tone: "cyan" | "amber" | "green" | "pink";
}) {
  return (
    <Card>
      <CardBody>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-semibold text-[#111827]">{title}</h3>
          <Badge tone={tone}>{features.length}</Badge>
        </div>
        {features.length === 0 ? (
          <p className="text-sm text-[#6B7280]">{emptyLabel}</p>
        ) : null}
        <div className="grid gap-2">
          {features.map((feature) => (
            <div
              key={feature.featureId}
              className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FC] p-3"
            >
              <p className="text-sm font-medium text-[#111827]">
                {feature.featureTitle}
              </p>
              {feature.error ? (
                <p className="mt-1 text-xs text-[#EF4444]">{feature.error}</p>
              ) : null}
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

export function CreateProjectWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaces = useWorkspaces();
  const expandIdea = useExpandProjectIdea();
  const startPlanJob = useStartGeneratePlanJob();
  const cancelPlanJob = useCancelGeneratePlanJob();
  const createFromIdea = useCreateProjectFromIdea();
  const productOwnerModel = useOllamaModelLabel(defaultRoleModels.productOwner);
  const pmModel = useOllamaModelLabel(defaultRoleModels.pm);
  const workspaceIdParam = searchParams.get("workspaceId") ?? "";
  const [step, setStep] = useState<WizardStep>("idea");
  const [idea, setIdea] = useState<ProjectIdeaInput>({
    workspaceId: workspaceIdParam,
    projectName: "",
    idea: "",
    targetAudience: "",
    goals: "",
    generationMode: "FAST",
  });
  const [vision, setVision] = useState<ProductVision>();
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
  const [productOwnerStartedAt, setProductOwnerStartedAt] = useState<Date>();
  const [pmStartedAt, setPmStartedAt] = useState<Date>();
  const [planJobId, setPlanJobId] = useState<string>();
  const planJob = useGeneratePlanJob(planJobId);

  useEffect(() => {
    if (idea.workspaceId || !workspaces.data?.[0]) return;
    setIdea((current) => ({ ...current, workspaceId: workspaces.data[0].id }));
  }, [idea.workspaceId, workspaces.data]);

  useEffect(() => {
    const status = planJob.data?.status;
    if (status === "SUCCESS" || status === "FAILED" || status === "CANCELLED") {
      setPmStartedAt(undefined);
    }
  }, [planJob.data?.status]);

  useEffect(() => {
    if (step === "planning" && planJob.data?.status === "SUCCESS") {
      setStep("documents");
    }
  }, [planJob.data?.status, step]);

  const selectedFeatures = useMemo<ProductFeature[]>(() => {
    return flattenFeatures(vision).filter((featureItem) =>
      selectedFeatureIds.includes(featureItem.id)
    );
  }, [selectedFeatureIds, vision]);

  function generateVision() {
    setProductOwnerStartedAt(new Date());
    expandIdea.mutate(idea, {
      onSuccess: (result) => {
        setVision(result);
        setSelectedFeatureIds(
          result.features.mvp.map((featureItem) => featureItem.id)
        );
        setStep("vision");
        setProductOwnerStartedAt(undefined);
      },
      onError: () => {
        setProductOwnerStartedAt(undefined);
      },
    });
  }

  function generateExecutionPlanFromSelection() {
    setPmStartedAt(new Date());
    if (!vision) return;
    startPlanJob.mutate(
      {
        workspaceId: idea.workspaceId,
        projectName: idea.projectName,
        idea: idea.idea,
        generationMode: idea.generationMode,
        productVision: vision,
        selectedFeatures,
      },
      {
        onSuccess: (result) => {
          setPlanJobId(result.jobId);
          setStep("planning");
        },
        onError: () => {
          setPmStartedAt(undefined);
        },
      }
    );
  }

  function createProjectBoard() {
    const resultPlan = planJob.data?.resultPlan;
    const documents = planJob.data?.generatedDocuments;
    if (!vision || !resultPlan || !documents) return;
    setStep("create");
    createFromIdea.mutate(
      { idea, vision, documents, plan: resultPlan },
      {
        onSuccess: (result) =>
          router.push(`/projects/${result.project.id}?view=board`),
      }
    );
  }

  function cancelJob() {
    if (!planJobId) return;
    cancelPlanJob.mutate(planJobId);
  }

  function retryPlanJob() {
    setPlanJobId(undefined);
    setStep("vision");
    generateExecutionPlanFromSelection();
  }

  function toggleFeature(featureId: string) {
    setSelectedFeatureIds((current) =>
      current.includes(featureId)
        ? current.filter((item) => item !== featureId)
        : [...current, featureId]
    );
  }

  function selectStage(stage: ProductFeatureStage) {
    if (!vision) return;
    const stageFeatureIds = featuresForStage(vision, stage).map(
      (featureItem) => featureItem.id
    );
    setSelectedFeatureIds((current) =>
      Array.from(new Set([...current, ...stageFeatureIds]))
    );
  }

  return (
    <AppShell title="Create Project From Idea" eyebrow="Product Discovery">
      <div className="mx-auto grid max-w-6xl gap-5 pb-12">
        <Stepper currentStep={step} />
        {expandIdea.isError ? (
          <ErrorState
            message={mutationErrorMessage(
              expandIdea.error,
              "Could not generate the Product Owner review."
            )}
          />
        ) : null}
        {startPlanJob.isError ? (
          <ErrorState
            message={mutationErrorMessage(
              startPlanJob.error,
              "Could not start the PM execution plan job."
            )}
          />
        ) : null}
        {planJob.isError ? (
          <ErrorState
            message={mutationErrorMessage(
              planJob.error,
              "Could not load the PM execution plan job."
            )}
          />
        ) : null}
        {createFromIdea.isError ? (
          <ErrorState message="Could not create the project board." />
        ) : null}

        {step === "idea" ? (
          <div className="grid gap-4">
            {expandIdea.isPending ? (
              <GenerationLoadingCard
                title="Product Owner is shaping your idea"
                subtitle="Expanding your rough idea into product vision, domains, features, and roadmap."
                startedAt={productOwnerStartedAt}
              />
            ) : null}
            <IdeaForm
              input={idea}
              onChange={setIdea}
              onSubmit={generateVision}
              isPending={expandIdea.isPending}
              productOwnerModel={productOwnerModel}
            />
          </div>
        ) : null}
        {step === "vision" && vision ? (
          <div className="grid gap-4">
            <Card>
              <CardBody>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="cyan">Product Owner</Badge>
                  <h2 className="text-lg font-semibold text-[#111827]">
                    Product Direction
                  </h2>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#374151]">
                  {vision.vision}
                </p>
                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <ReviewList title="Goals" items={vision.goals} />
                  <ReviewList title="Target users" items={vision.targetUsers} />
                  <ReviewList title="Domains" items={vision.domains} />
                  <ReviewList title="Roadmap" items={vision.roadmap} />
                </div>
              </CardBody>
            </Card>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setStep("features")}>
                Select Features
              </Button>
              <Button variant="ghost" onClick={() => setStep("idea")}>
                Back
              </Button>
            </div>
          </div>
        ) : null}
        {step === "features" && vision ? (
          <div className="grid gap-4">
            {startPlanJob.isPending ? (
              <GenerationLoadingCard
                title="PM is preparing the execution plan job"
                subtitle="Selected features will be planned one by one so local models stay stable."
                startedAt={pmStartedAt}
              />
            ) : null}
            <ProductOwnerReview
              vision={vision}
              selectedFeatureIds={selectedFeatureIds}
              onToggleFeature={toggleFeature}
              onSelectStage={selectStage}
              onGeneratePlan={generateExecutionPlanFromSelection}
              onBack={() => setStep("vision")}
              isPending={startPlanJob.isPending}
              generationMode={idea.generationMode}
              pmModel={pmModel}
            />
          </div>
        ) : null}
        {step === "planning" ? (
          <PlanningJobReview
            job={planJob.data}
            onBack={() => setStep("features")}
            onCancel={cancelJob}
          />
        ) : null}
        {step === "documents" ? (
          <PMDocumentsReview
            job={planJob.data}
            onContinue={() => setStep("tasks")}
            onBack={() => setStep("vision")}
            onCancel={cancelJob}
          />
        ) : null}
        {step === "tasks" ? (
          <PMPlanReview
            job={planJob.data}
            onCreateProject={createProjectBoard}
            onBack={() => setStep("documents")}
            onCancel={cancelJob}
            onRetry={retryPlanJob}
            isPending={createFromIdea.isPending}
          />
        ) : null}
        {step === "create" ? (
          <Card>
            <CardBody>
              <h2 className="text-lg font-semibold text-[#111827]">
                Creating project board
              </h2>
              <p className="mt-2 text-sm text-[#6B7280]">
                Creating the project, default board, planning documents, and
                Backlog tasks.
              </p>
              <Skeleton className="mt-5 h-3 w-full" />
              <Skeleton className="mt-3 h-3 w-4/5" />
            </CardBody>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
