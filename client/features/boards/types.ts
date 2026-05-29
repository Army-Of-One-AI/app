import type { Task } from "@/features/tasks/types";

export type BoardColumn = {
  id: string;
  board_id: string;
  name: string;
  order: number;
  created_at: string;
  updated_at: string;
  tasks?: Task[];
};

export type Board = {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  columns?: BoardColumn[];
};
