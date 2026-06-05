import { useInfiniteQuery } from "@tanstack/react-query";
import { GetTaskActivitiesParams } from "../types";
import { getTaskActivities } from "../api/getTaskActivities";

export default function useTaskActivities(params: GetTaskActivitiesParams) {
  return useInfiniteQuery({
    queryKey: [
      "get-task-activities",
      params.workspaceSlug,
      params.projectSlug,
      params.taskId,
      params.limit,
    ],
    enabled: !!params.projectSlug && !!params.workspaceSlug && !!params.taskId,
    initialPageParam: undefined as string | undefined,
    refetchOnMount: "always",
    queryFn: ({ pageParam }) =>
      getTaskActivities({
        ...params,
        cursor: pageParam,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined,
  });
}
