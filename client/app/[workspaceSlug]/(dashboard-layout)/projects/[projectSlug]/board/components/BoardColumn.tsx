import { Task } from "@/features/tasks/types";
import { BoardColumn, BoardStatus } from "../page";
import KanbanColumn from "./KanbanColumn";

export default function BoardColumns({
  columns,
  tasksByStatus,
  disabled = false,
  onCreateTask,
  canCreateTask,
  canUpdateTaskStatus,
  onOpenTaskDetails,
  refetchingTaskIds,
}: {
  columns: readonly BoardColumn[];
  tasksByStatus: Record<BoardStatus, Task[]>;
  disabled?: boolean;
  onCreateTask: (status: BoardStatus) => void;
  canCreateTask: boolean;
  canUpdateTaskStatus: boolean;
  onOpenTaskDetails: (taskID: string) => void;
  refetchingTaskIds: string[];
}) {
  return (
    <div className="flex flex-1 gap-4 overflow-x-auto overflow-y-hidden pb-4">
      {columns.map((column) => (
        <KanbanColumn
          key={column.key}
          id={column.key}
          title={column.title}
          tasks={tasksByStatus[column.key] ?? []}
          disabled={disabled}
          canUpdateTaskStatus={canUpdateTaskStatus}
          canCreateTask={canCreateTask}
          onCreateTask={onCreateTask}
          onOpenTaskDetails={onOpenTaskDetails}
          refetchingTaskIds={refetchingTaskIds}
        />
      ))}
    </div>
  );
}
