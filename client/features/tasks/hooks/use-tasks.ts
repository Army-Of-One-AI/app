"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";
import type { Board } from "@/features/boards/types";
import type { Project } from "@/features/projects/types";
import {
  createTask,
  createTaskComment,
  getTask,
  getTaskComments,
  getTasks,
  moveTask,
  updateTask,
} from "../api/tasks-api";
import type { CreateTaskCommentInput, CreateTaskInput, MoveTaskInput, Task, UpdateTaskInput } from "../types";

type QuerySnapshot<T> = Array<[QueryKey, T | undefined]>;

type TaskMutationContext = {
  previousTaskQueries: QuerySnapshot<Task[]>;
  previousTaskDetail: Task | undefined;
  previousBoardQueries: QuerySnapshot<Board>;
  previousProjectQueries: QuerySnapshot<Project>;
};

function updateTaskInList(tasks: Task[] | undefined, taskId: string, update: Partial<Task>) {
  if (!tasks) return tasks;
  return tasks.map((task) => (task.id === taskId ? { ...task, ...update, updated_at: new Date().toISOString() } : task));
}

function updateTaskInBoard(board: Board | undefined, taskId: string, update: Partial<Task>) {
  if (!board?.columns) return board;
  return {
    ...board,
    columns: board.columns.map((column) => ({
      ...column,
      tasks: updateTaskInList(column.tasks, taskId, update),
    })),
  };
}

function updateTaskInProject(project: Project | undefined, taskId: string, update: Partial<Task>) {
  if (!project) return project;
  return {
    ...project,
    tasks: updateTaskInList(project.tasks, taskId, update),
    boards: project.boards?.map((board) => updateTaskInBoard(board, taskId, update) ?? board),
  };
}

function isColumnTaskQuery(queryKey: QueryKey): queryKey is ["tasks", string | undefined, string | undefined, string] {
  return queryKey[0] === "tasks" && typeof queryKey[3] === "string";
}

function reconcileColumnTaskQuery(
  queryKey: QueryKey,
  tasks: Task[] | undefined,
  previousTask: Task | undefined,
  taskId: string,
  update: Partial<Task>,
) {
  if (!tasks || !isColumnTaskQuery(queryKey) || !update.column_id) {
    return updateTaskInList(tasks, taskId, update);
  }

  const queryColumnId = queryKey[3];
  if (queryColumnId === update.column_id) {
    const containsTask = tasks.some((task) => task.id === taskId);
    if (containsTask) return updateTaskInList(tasks, taskId, update);
    if (!previousTask) return tasks;
    return [...tasks, { ...previousTask, ...update, updated_at: new Date().toISOString() }].sort((a, b) => a.order - b.order);
  }

  return tasks.filter((task) => task.id !== taskId);
}

export function useTasks(filters: { projectId?: string; boardId?: string; columnId?: string }) {
  return useQuery({
    queryKey: ["tasks", filters.projectId, filters.boardId, filters.columnId],
    queryFn: () => getTasks(filters),
    enabled: Boolean(filters.projectId || filters.boardId || filters.columnId),
  });
}

export function useAllTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: () => getTasks({}),
  });
}

export function useTask(taskId: string | undefined) {
  return useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTask(taskId as string),
    enabled: Boolean(taskId),
  });
}

export function useCreateTask(projectId: string | undefined, boardId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks", projectId, boardId] });
      void queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });
}

export function useUpdateTask(projectId: string | undefined, boardId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) => updateTask(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      await queryClient.cancelQueries({ queryKey: ["task", id] });
      await queryClient.cancelQueries({ queryKey: ["board"] });
      await queryClient.cancelQueries({ queryKey: ["project"] });

      const previousTaskQueries = queryClient.getQueriesData<Task[]>({ queryKey: ["tasks"] });
      const previousTaskDetail = queryClient.getQueryData<Task>(["task", id]);
      const previousBoardQueries = queryClient.getQueriesData<Board>({ queryKey: ["board"] });
      const previousProjectQueries = queryClient.getQueriesData<Project>({ queryKey: ["project"] });
      const optimisticUpdate: Partial<Task> = {
        title: input.title,
        description: input.description,
        priority: input.priority,
        status: input.status,
        order: input.order,
        column_id: input.columnId,
        assignee_role_id: input.assigneeRoleId,
        acceptance_criteria: input.acceptanceCriteria,
        technical_notes: input.technicalNotes,
        test_cases: input.testCases,
      };
      const compactUpdate = Object.fromEntries(
        Object.entries(optimisticUpdate).filter(([, value]) => value !== undefined),
      ) as Partial<Task>;

      previousTaskQueries.forEach(([queryKey]) => {
        queryClient.setQueryData<Task[]>(queryKey, (oldTasks) => updateTaskInList(oldTasks, id, compactUpdate));
      });
      queryClient.setQueryData<Task>(["task", id], (oldTask) =>
        oldTask ? { ...oldTask, ...compactUpdate, updated_at: new Date().toISOString() } : oldTask,
      );
      queryClient.setQueriesData<Board>({ queryKey: ["board"] }, (oldBoard) =>
        updateTaskInBoard(oldBoard, id, compactUpdate),
      );
      queryClient.setQueriesData<Project>({ queryKey: ["project"] }, (oldProject) =>
        updateTaskInProject(oldProject, id, compactUpdate),
      );

      return { previousTaskQueries, previousTaskDetail, previousBoardQueries, previousProjectQueries } satisfies TaskMutationContext;
    },
    onError: (_error, variables, context) => {
      context?.previousTaskQueries.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
      queryClient.setQueryData(["task", variables.id], context?.previousTaskDetail);
      context?.previousBoardQueries.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
      context?.previousProjectQueries.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
    },
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["task", variables.id] });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      void queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });
}

export function useMoveTask(projectId: string | undefined, boardId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MoveTaskInput }) => moveTask(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      await queryClient.cancelQueries({ queryKey: ["task", id] });
      await queryClient.cancelQueries({ queryKey: ["board"] });
      await queryClient.cancelQueries({ queryKey: ["project"] });

      const previousTaskQueries = queryClient.getQueriesData<Task[]>({ queryKey: ["tasks"] });
      const previousTaskDetail = queryClient.getQueryData<Task>(["task", id]);
      const previousBoardQueries = queryClient.getQueriesData<Board>({ queryKey: ["board"] });
      const previousProjectQueries = queryClient.getQueriesData<Project>({ queryKey: ["project"] });
      const optimisticUpdate: Partial<Task> = {
        column_id: input.columnId,
        status: input.status ?? previousTaskDetail?.status,
        order: input.order,
      };

      previousTaskQueries.forEach(([queryKey]) => {
        queryClient.setQueryData<Task[]>(queryKey, (oldTasks) =>
          reconcileColumnTaskQuery(queryKey, oldTasks, previousTaskDetail, id, optimisticUpdate),
        );
      });
      queryClient.setQueryData<Task>(["task", id], (oldTask) =>
        oldTask ? { ...oldTask, ...optimisticUpdate, updated_at: new Date().toISOString() } : oldTask,
      );
      queryClient.setQueriesData<Board>({ queryKey: ["board"] }, (oldBoard) =>
        updateTaskInBoard(oldBoard, id, optimisticUpdate),
      );
      queryClient.setQueriesData<Project>({ queryKey: ["project"] }, (oldProject) =>
        updateTaskInProject(oldProject, id, optimisticUpdate),
      );

      return { previousTaskQueries, previousTaskDetail, previousBoardQueries, previousProjectQueries } satisfies TaskMutationContext;
    },
    onError: (_error, variables, context) => {
      context?.previousTaskQueries.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
      queryClient.setQueryData(["task", variables.id], context?.previousTaskDetail);
      context?.previousBoardQueries.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
      context?.previousProjectQueries.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
    },
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["task", variables.id] });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      void queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });
}

export function useTaskComments(taskId: string | undefined) {
  return useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: () => getTaskComments(taskId as string),
    enabled: Boolean(taskId),
  });
}

export function useCreateTaskComment(taskId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskCommentInput) => createTaskComment(taskId as string, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
    },
  });
}
