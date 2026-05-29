"use client";

import { Badge, Card, CardBody, EmptyState, ErrorState, Skeleton } from "@/shared/ui/components";
import { useTaskAgentRuns } from "../hooks/use-agent-runs";

export function AgentRunList({ taskId }: { taskId: string }) {
  const runs = useTaskAgentRuns(taskId);

  if (runs.isLoading) {
    return (
      <div role="status" aria-busy="true" aria-label="Loading team role runs" className="grid gap-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardBody>
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-32 rounded-full" />
              </div>
              <Skeleton className="mt-4 h-4 w-16" />
              <Skeleton className="mt-2 h-4 w-4/5" />
              <Skeleton className="mt-4 h-4 w-24" />
              <Skeleton className="mt-2 h-20 w-full" />
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }
  if (runs.isError) return <ErrorState message="Could not load team role runs." />;
  if (!runs.data?.length) return <EmptyState title="No team role runs" description="Run a core team role from the task." />;

  return (
    <div className="grid gap-3">
      {runs.data.map((run) => (
        <Card key={run.id}>
          <CardBody>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="cyan">{run.agent?.name ?? run.agent_id}</Badge>
              <Badge tone={run.status === "SUCCESS" ? "green" : run.status === "FAILED" ? "pink" : "amber"}>
                {run.status}
              </Badge>
              <Badge>Placeholder execution</Badge>
            </div>
            <p className="mt-3 text-sm font-medium text-[#111827]">Input</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-[#6B7280]">{run.input}</p>
            <p className="mt-3 text-sm font-medium text-[#111827]">Role output</p>
            <p className="mt-1 whitespace-pre-wrap rounded-xl bg-[#F7F8FC] p-3 text-sm text-[#111827]">
              {run.output ?? run.error ?? "No output yet."}
            </p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
