"use client";

import { useQuery } from "@tanstack/react-query";
import { getBoard, getBoardsByProject } from "../api/boards-api";

export function useBoardsByProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ["boards", projectId],
    queryFn: () => getBoardsByProject(projectId as string),
    enabled: Boolean(projectId),
  });
}

export function useBoard(boardId: string | undefined) {
  return useQuery({
    queryKey: ["board", boardId],
    queryFn: () => getBoard(boardId as string),
    enabled: Boolean(boardId),
  });
}
