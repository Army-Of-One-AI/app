"use client";

import { useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCreateTask, useMoveTask, useTasks } from "@/features/tasks/hooks/use-tasks";
import type { Task, TaskPriority, TaskStatus } from "@/features/tasks/types";
import { Button, Card, CardBody, EmptyState, ErrorState, Field, Input, PriorityBadge, RoleBadge, Select, StatusBadge, WorkspaceCanvas } from "@/shared/ui/components";
import { BoardSkeleton } from "./board-skeleton";
import { useBoardsByProject } from "../hooks/use-boards";
import type { BoardColumn } from "../types";

const priorities: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function statusForColumn(column: BoardColumn): TaskStatus | undefined {
  const normalized = column.name.trim().toUpperCase().replace(/[\s-]+/g, "_");
  const allowed: TaskStatus[] = ["BACKLOG", "READY", "IN_PROGRESS", "REVIEW", "TESTING", "DONE"];
  return allowed.includes(normalized as TaskStatus) ? (normalized as TaskStatus) : undefined;
}

function TaskCard({
  task,
  columns,
  onOpen,
  selected,
  onMove,
  moving,
  dragging = false,
}: {
  task: Task;
  columns: BoardColumn[];
  onOpen: () => void;
  selected: boolean;
  onMove: (column: BoardColumn, order: number) => void;
  moving: boolean;
  dragging?: boolean;
}) {
  const currentIndex = columns.findIndex((column) => column.id === task.column_id);
  const previousColumn = currentIndex > 0 ? columns[currentIndex - 1] : undefined;
  const nextColumn = currentIndex >= 0 && currentIndex < columns.length - 1 ? columns[currentIndex + 1] : undefined;

  function openDetails(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onOpen();
  }

  function stopPointerPropagation(event: React.PointerEvent<HTMLButtonElement>) {
    event.stopPropagation();
  }

  return (
    <Card className={`group shadow-none transition hover:border-[#4F46E5]/40 hover:shadow-sm focus-within:border-[#4F46E5]/40 ${selected ? "border-[#4F46E5] bg-[#EEF2FF]/45" : "border-[#E5E7EB] bg-white"} ${dragging ? "opacity-40" : ""}`}>
      <CardBody className="grid gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="line-clamp-2 text-sm font-medium text-[#111827]">{task.title}</h4>
          <Button
            className="h-7 min-h-7 shrink-0 px-2 text-xs opacity-0 transition focus:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100"
            variant="ghost"
            onClick={openDetails}
            onPointerDown={stopPointerPropagation}
          >
            Details
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <PriorityBadge priority={task.priority} />
          <RoleBadge role={task.assignee_role?.role ?? task.assignee_role?.name} />
        </div>
        <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
          <StatusBadge status={task.status} />
          <span>{task.order}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 opacity-0 transition group-hover:opacity-100">
          <Button className="h-8 min-h-8 px-2 text-xs" variant="ghost" disabled={!previousColumn || moving} onClick={() => previousColumn ? onMove(previousColumn, 0) : undefined}>
            ←
          </Button>
          <Button className="h-8 min-h-8 px-2 text-xs" variant="ghost" disabled={!nextColumn || moving} onClick={() => nextColumn ? onMove(nextColumn, 0) : undefined}>
            →
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function DraggableTaskCard({
  task,
  columns,
  selected,
  moving,
  onOpen,
  onMove,
}: {
  task: Task;
  columns: BoardColumn[];
  selected: boolean;
  moving: boolean;
  onOpen: () => void;
  onMove: (column: BoardColumn, order: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: {
      type: "task",
      taskId: task.id,
      columnId: task.column_id,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        columns={columns}
        selected={selected}
        moving={moving}
        dragging={isDragging}
        onOpen={onOpen}
        onMove={onMove}
      />
    </div>
  );
}

function KanbanColumn({
  column,
  columnTasks,
  columns,
  selectedTaskId,
  moving,
  onSelectTask,
  onMove,
}: {
  column: BoardColumn;
  columnTasks: Task[];
  columns: BoardColumn[];
  selectedTaskId?: string;
  moving: boolean;
  onSelectTask?: (taskId: string | undefined) => void;
  onMove: (task: Task, targetColumn: BoardColumn, order: number) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      columnId: column.id,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex h-full w-80 shrink-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
        isOver ? "border-[#4F46E5] ring-4 ring-[#4F46E5]/10" : "border-[#E5E7EB]"
      }`}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E7EB] bg-white/95 px-4 py-3 backdrop-blur">
        <h3 className="text-sm font-semibold text-[#111827]">{column.name}</h3>
        <span className="rounded-full bg-[#F7F8FC] px-2 py-1 text-xs font-medium text-[#6B7280]">{columnTasks.length}</span>
      </div>
      <div className="grid flex-1 content-start gap-3 overflow-y-auto p-3">
        {columnTasks.map((task, index) => (
          <DraggableTaskCard
            key={task.id}
            task={task}
            columns={columns}
            selected={selectedTaskId === task.id}
            moving={moving}
            onOpen={() => onSelectTask?.(task.id)}
            onMove={(targetColumn, order) => onMove(task, targetColumn, order || columnTasks.length || index)}
          />
        ))}
        {!columnTasks.length ? (
          <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F7F8FC]/80 p-4 text-center">
            <p className="text-sm font-medium text-[#111827]">Drop tasks here</p>
            <p className="mt-1 text-xs text-[#6B7280]">This lane is ready.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ProjectKanban({
  projectId,
  workspaceId,
  showCreateForm = true,
  selectedTaskId,
  onSelectTask,
}: {
  projectId: string | undefined;
  workspaceId: string;
  showCreateForm?: boolean;
  selectedTaskId?: string;
  onSelectTask?: (taskId: string | undefined) => void;
}) {
  const boards = useBoardsByProject(projectId);
  const board = boards.data?.[0];
  const tasks = useTasks({ projectId, boardId: board?.id });
  const createTask = useCreateTask(projectId, board?.id);
  const moveTask = useMoveTask(projectId, board?.id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeTaskId, setActiveTaskId] = useState<string>();
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM" as TaskPriority, columnId: "" });
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const columns = useMemo(() => [...(board?.columns ?? [])].sort((a, b) => a.order - b.order), [board?.columns]);
  const tasksByColumn = useMemo(() => {
    const grouped = new Map<string, Task[]>();
    for (const column of columns) grouped.set(column.id, []);
    for (const task of tasks.data ?? []) {
      if (task.column_id && grouped.has(task.column_id)) {
        grouped.get(task.column_id)?.push(task);
      }
    }
    return grouped;
  }, [columns, tasks.data]);
  const activeTask = useMemo(() => tasks.data?.find((task) => task.id === activeTaskId), [activeTaskId, tasks.data]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectId || !form.title.trim()) return;
    const columnId = form.columnId || columns[0]?.id;
    createTask.mutate(
      {
        projectId,
        columnId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        status: columnId ? statusForColumn(columns.find((column) => column.id === columnId) as BoardColumn) : undefined,
      },
      {
        onSuccess: () => setForm({ title: "", description: "", priority: "MEDIUM", columnId: "" }),
      },
    );
  }

  function moveTaskToColumn(task: Task, targetColumn: BoardColumn, order: number) {
    if (task.column_id === targetColumn.id && task.order === order) return;
    moveTask.mutate({
      id: task.id,
      input: {
        columnId: targetColumn.id,
        order,
        status: statusForColumn(targetColumn),
      },
    });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveTaskId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const taskId = String(event.active.id);
    setActiveTaskId(undefined);
    if (!event.over) return;

    const targetColumn = columns.find((column) => column.id === String(event.over?.id));
    const task = tasks.data?.find((item) => item.id === taskId);
    if (!targetColumn || !task) return;

    const targetTasks = tasksByColumn.get(targetColumn.id) ?? [];
    const order = task.column_id === targetColumn.id ? task.order : targetTasks.length;
    moveTaskToColumn(task, targetColumn, order);
  }

  function handleCanvasWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (!event.shiftKey || !scrollRef.current) return;
    event.preventDefault();
    scrollRef.current.scrollLeft += event.deltaY;
  }

  if (!projectId) return <EmptyState title="Select a project" description="Choose a project to open its Kanban board." />;
  if (boards.isLoading) return <BoardSkeleton />;
  if (boards.isError) return <ErrorState message="Could not load boards." />;
  if (!board) return <EmptyState title="No board" description="The backend did not return a board for this project." />;
  if (tasks.isLoading) return <BoardSkeleton />;

  return (
    <WorkspaceCanvas dotted>
      <section className="grid h-full min-w-0 grid-rows-[auto_1fr] gap-3 p-3">
      {showCreateForm ? (
        <Card className="border-[#E5E7EB] shadow-sm">
          <CardBody>
            <form className="grid gap-3 lg:grid-cols-[1fr_1fr_160px_180px_auto]" onSubmit={submit}>
            <Field label="Task title">
              <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Build login flow" />
            </Field>
            <Field label="Description">
              <Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Short context" />
            </Field>
            <Field label="Priority">
              <Select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as TaskPriority })}>
                {priorities.map((priority) => <option key={priority}>{priority}</option>)}
              </Select>
            </Field>
            <Field label="Column">
              <Select value={form.columnId} onChange={(event) => setForm({ ...form, columnId: event.target.value })}>
                <option value="">First column</option>
                {columns.map((column) => <option key={column.id} value={column.id}>{column.name}</option>)}
              </Select>
            </Field>
            <div className="flex items-end">
              <Button type="submit" disabled={createTask.isPending}>Create task</Button>
            </div>
            </form>
          </CardBody>
        </Card>
      ) : null}

      {tasks.isError ? <ErrorState message="Could not load tasks." /> : null}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveTaskId(undefined)}>
        <div
          ref={scrollRef}
          onWheel={handleCanvasWheel}
          className="h-[calc(100vh-132px)] min-h-[560px] overflow-x-auto overflow-y-hidden scroll-smooth rounded-2xl border border-[#E5E7EB]/70 bg-white/35 p-4 shadow-inner"
        >
          <div className="flex h-full min-w-max gap-4 pr-8">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                columnTasks={tasksByColumn.get(column.id) ?? []}
                columns={columns}
                selectedTaskId={selectedTaskId}
                moving={moveTask.isPending}
                onSelectTask={onSelectTask}
                onMove={moveTaskToColumn}
              />
            ))}
          </div>
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className="w-80 rotate-1 opacity-95 shadow-xl">
              <TaskCard
                task={activeTask}
                columns={columns}
                selected={false}
                moving={false}
                dragging={false}
                onOpen={() => undefined}
                onMove={() => undefined}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      </section>
    </WorkspaceCanvas>
  );
}
