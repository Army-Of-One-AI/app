"use client";

import { useAgentRunsByAgent } from "@/features/agent-runs/hooks/use-agent-runs";
import { EmptyState, InspectorPanel, InspectorSection, RoleBadge } from "@/shared/ui/components";
import { getCoreTeamRoleConfig } from "../core-team";
import { useAgentRoles } from "../hooks/use-agent-roles";
import { buildAgentPipelineSteps } from "./agent-pipeline-view";

export function AgentPipelineInspector({
  workspaceId,
  selectedStepId,
}: {
  workspaceId: string;
  selectedStepId: string | undefined;
}) {
  const roles = useAgentRoles(workspaceId);
  const step = buildAgentPipelineSteps(roles.data).find((item) => item.id === selectedStepId);
  const runs = useAgentRunsByAgent(step?.agent?.id);
  const roleConfig = step?.roleType ? getCoreTeamRoleConfig(step.roleType) : undefined;

  if (!step) {
    return (
      <InspectorPanel title="Pipeline" subtitle="Select a pipeline stage to inspect role configuration.">
        <EmptyState title="No step selected" description="Role config, prompt, model, and recent runs appear here." />
      </InspectorPanel>
    );
  }

  return (
    <InspectorPanel title={step.agent?.name ?? step.title} subtitle={step.action}>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-[#EEF2FF] px-2 py-1 text-xs font-medium text-[#4F46E5]">
          {step.kind === "idea" ? "Idea intake" : "Pipeline stage"}
        </span>
        {step.roleType ? <RoleBadge role={step.roleType} /> : null}
      </div>

      <InspectorSection title="Role configuration">
        <div className="grid gap-3 text-sm text-[#111827]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal text-[#6B7280]">Responsibility</p>
            <p className="mt-1">{step.responsibility}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal text-[#6B7280]">Role</p>
            <p className="mt-1">{roleConfig?.name ?? "Idea intake"}</p>
          </div>
        </div>
      </InspectorSection>

      <InspectorSection title="System prompt preview">
        <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FC] p-3">
          <p className="whitespace-pre-wrap text-sm text-[#111827]">
            {step.agent?.system_prompt ?? roleConfig?.systemPromptPreview ?? "Raw product ideas enter the execution flow here."}
          </p>
        </div>
      </InspectorSection>

      <InspectorSection title="Active skills">
        <div className="flex flex-wrap gap-2">
          {(roleConfig?.skills ?? ["idea intake"]).map((skill) => (
            <span key={skill} className="rounded-full bg-[#F7F8FC] px-2 py-1 text-xs font-medium text-[#6B7280]">
              {skill}
            </span>
          ))}
        </div>
      </InspectorSection>

      <InspectorSection title="Model">
        <p className="text-sm text-[#6B7280]">
          {step.agent?.model_provider?.name ?? step.agent?.model_provider?.model_name ?? "No model provider assigned."}
        </p>
      </InspectorSection>

      <InspectorSection title="Recent runs">
        <div className="grid gap-3">
          {step.kind === "idea" ? <EmptyState title="Idea stage has no runs" description="Execution continues through the core team pipeline." /> : null}
          {step.kind === "role" && runs.data?.length === 0 ? (
            <EmptyState title="No recent runs" description="Run team roles from selected Kanban tasks to create run history." />
          ) : null}
          {runs.data?.map((run) => (
            <div key={run.id} className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FC] p-3">
              <p className="text-xs font-medium text-[#6B7280]">{run.status}</p>
              <p className="mt-1 line-clamp-3 text-sm text-[#111827]">{run.output ?? run.error ?? run.input}</p>
            </div>
          ))}
        </div>
      </InspectorSection>
    </InspectorPanel>
  );
}
