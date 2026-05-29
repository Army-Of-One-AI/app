"use client";

import { EmptyState, RoleBadge, WorkspaceCanvas } from "@/shared/ui/components";
import { coreTeamRoles, findCoreTeamRole } from "../core-team";
import { useAgentRoles } from "../hooks/use-agent-roles";
import type { AgentRole, AgentRoleType } from "../types";
import { AgentPipelineSkeleton } from "./agent-pipeline-skeleton";

export type AgentPipelineStepKind = "idea" | "role";

export type AgentPipelineStep = {
  id: string;
  order: number;
  kind: AgentPipelineStepKind;
  title: string;
  action: string;
  roleType?: AgentRoleType;
  responsibility: string;
  agent?: AgentRole;
};

export function buildAgentPipelineSteps(roles: AgentRole[] | undefined): AgentPipelineStep[] {
  return [
    {
      id: "idea-intake",
      order: 1,
      kind: "idea",
      title: "Idea",
      action: "raw product input",
      responsibility: "Starts with a founder idea, customer problem, or rough product direction.",
    },
    ...coreTeamRoles.map((step, index) => {
      const agent = findCoreTeamRole(roles, step.role);
      return {
        id: agent?.id ?? `missing-${step.role}`,
        order: index + 2,
        kind: "role" as const,
        title: step.name,
        action: step.purpose,
        roleType: step.role,
        responsibility: step.responsibilitySummary,
        agent,
      };
    }),
  ];
}

export function AgentPipelineView({
  workspaceId,
  selectedStepId,
  onSelectStep,
}: {
  workspaceId: string;
  selectedStepId: string | undefined;
  onSelectStep: (stepId: string | undefined) => void;
}) {
  const roles = useAgentRoles(workspaceId);
  const steps = buildAgentPipelineSteps(roles.data);

  if (roles.isLoading) {
    return (
      <WorkspaceCanvas>
        <AgentPipelineSkeleton />
      </WorkspaceCanvas>
    );
  }

  return (
    <WorkspaceCanvas>
      <div className="h-full min-h-[calc(100vh-112px)] overflow-auto bg-[#F7F8FC]">
        <div className="border-b border-[#E5E7EB] bg-white px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#111827]">Pipeline</h2>
              <p className="mt-1 text-xs text-[#6B7280]">
                Idea to shipped software through the fixed core team.
              </p>
            </div>
            <span className="rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#6B7280]">
              {"Idea -> Product Owner -> PM -> Designer -> Developer -> QC"}
            </span>
          </div>
        </div>

        {roles.isError ? (
          <div className="mx-auto mt-16 max-w-md px-6">
            <EmptyState title="Pipeline unavailable" description="Core team roles could not be loaded." />
          </div>
        ) : (
          <div className="mx-auto grid max-w-5xl gap-3 px-6 py-6">
            {steps.map((step, index) => {
              const configured = step.kind === "idea" || Boolean(step.agent);
              const selected = selectedStepId === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => onSelectStep(step.id)}
                  className={`grid gap-4 rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-[#4F46E5]/40 md:grid-cols-[48px_1fr_auto] ${
                    selected ? "border-[#4F46E5] ring-4 ring-[#4F46E5]/10" : "border-[#E5E7EB]"
                  }`}
                >
                  <div className="flex md:block">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#EEF2FF] text-sm font-semibold text-[#4F46E5]">
                      {step.order}
                    </div>
                    {index < steps.length - 1 ? <div className="ml-5 hidden h-12 w-px bg-[#E5E7EB] md:block" /> : null}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[#111827]">{step.title}</span>
                      <span className="rounded-full bg-[#F7F8FC] px-2 py-1 text-xs font-medium text-[#6B7280]">{step.action}</span>
                      {step.roleType ? <RoleBadge role={step.roleType} /> : null}
                    </div>
                    <p className="mt-2 text-sm text-[#6B7280]">{step.responsibility}</p>
                    {step.agent?.model_provider ? (
                      <p className="mt-2 text-xs text-[#6B7280]">Model: {step.agent.model_provider.name ?? step.agent.model_provider.model_name}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center md:justify-end">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${configured ? "bg-emerald-50 text-[#22C55E]" : "bg-red-50 text-[#EF4444]"}`}>
                      {configured ? "Ready" : "Needs configuration"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </WorkspaceCanvas>
  );
}
