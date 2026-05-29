"use client";

import { Settings } from "lucide-react";
import { useAgentRunsByAgent } from "@/features/agent-runs/hooks/use-agent-runs";
import { Badge, Button, Card, CardBody, ErrorState, RoleBadge, Skeleton } from "@/shared/ui/components";
import { coreTeamRoles, findCoreTeamRole, type CoreTeamRoleConfig } from "../core-team";
import { useAgentRoles } from "../hooks/use-agent-roles";
import type { AgentRole } from "../types";

function CoreTeamRoleCard({
  config,
  role,
}: {
  config: CoreTeamRoleConfig;
  role: AgentRole | undefined;
}) {
  const runs = useAgentRunsByAgent(role?.id);
  const configuredSkills = role?.description
    ? role.description
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
    : config.skills;
  const recentRunCount = runs.data?.length ?? 0;

  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-[#111827]">{config.name}</h3>
              <RoleBadge role={config.role} />
            </div>
            <p className="mt-1 text-xs font-medium text-[#6B7280]">{config.purpose}</p>
          </div>
          <Button variant="ghost" className="h-9 min-h-9 w-9 px-0" title={`Configure ${config.name}`}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <p className="mt-3 text-sm text-[#374151]">{config.responsibilitySummary}</p>

        <div className="mt-4 grid gap-3 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal text-[#6B7280]">Model provider</p>
            <p className="mt-1 text-[#111827]">
              {role?.model_provider?.name ?? role?.model_provider?.model_name ?? "Not configured"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal text-[#6B7280]">Active skills and preferences</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {configuredSkills.slice(0, 4).map((skill) => (
                <Badge key={skill} tone="slate">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F7F8FC] px-3 py-2">
            <span className="text-xs font-medium text-[#6B7280]">Recent runs</span>
            <span className="text-sm font-semibold text-[#111827]">{recentRunCount}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export function AgentRoleManager({ workspaceId }: { workspaceId: string }) {
  const roles = useAgentRoles(workspaceId);

  if (roles.isLoading) {
    return (
      <div role="status" aria-busy="true" aria-label="Loading core team" className="grid gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index}>
            <CardBody>
              <Skeleton className="h-4 w-36" />
              <Skeleton className="mt-2 h-3 w-48" />
              <Skeleton className="mt-4 h-16 w-full" />
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  if (roles.isError) return <ErrorState message="Could not load core team." />;

  return (
    <div className="grid gap-3">
      {coreTeamRoles.map((config) => (
        <CoreTeamRoleCard key={config.role} config={config} role={findCoreTeamRole(roles.data, config.role)} />
      ))}
    </div>
  );
}
