"use client";

import { createTaskAction, deleteTaskAction, moveTaskAction, updateTaskAction, updateTaskStatusAction } from "@/app/(dashboard)/tarefas/actions";
import TopBar from "@/components/top-bar";
import { QuietAction } from "@/components/quiet-action";
import { useDashboard } from "@/contexts/dashboard-context";
import { initials, matchesQuery } from "@/lib/format";
import { createTaskSchema, type CreateTaskInput } from "@/server/validators/tasks";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@bethel/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@bethel/ui/components/dialog";
import { Input } from "@bethel/ui/components/input";
import { Label } from "@bethel/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bethel/ui/components/select";
import { Plus } from "reicon-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

// Mirrors the Prisma `TaskStatus` enum. Duplicated here (instead of importing
// from @bethel/db) so this client component never pulls the Prisma/pg runtime
// into the browser bundle.
const TaskStatus = { TODO: "TODO", IN_PROGRESS: "IN_PROGRESS", DONE: "DONE" } as const;
type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

interface Member {
  id: string;
  name: string;
  avatarColor: string;
}

interface Task {
  id: string;
  title: string;
  room: string;
  status: TaskStatus;
  assignedTo: { id: string; name: string; avatarColor: string } | null;
}

interface TarefasViewProps {
  tasks: Task[];
  members: Member[];
}

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: TaskStatus.TODO, label: "A fazer", color: "#c0764f" },
  { status: TaskStatus.IN_PROGRESS, label: "Em andamento", color: "#c79a3e" },
  { status: TaskStatus.DONE, label: "Concluído", color: "#4f8a6b" },
];

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  [TaskStatus.TODO]: TaskStatus.IN_PROGRESS,
  [TaskStatus.IN_PROGRESS]: TaskStatus.DONE,
  [TaskStatus.DONE]: TaskStatus.TODO,
};

function groupByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  return {
    [TaskStatus.TODO]: tasks.filter((t) => t.status === TaskStatus.TODO),
    [TaskStatus.IN_PROGRESS]: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS),
    [TaskStatus.DONE]: tasks.filter((t) => t.status === TaskStatus.DONE),
  };
}

export default function TarefasView({ tasks, members }: TarefasViewProps) {
  const { searchQuery } = useDashboard();
  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [columns, setColumns] = useState<Record<TaskStatus, Task[]>>(() => groupByStatus(tasks));
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  useEffect(() => {
    setColumns(groupByStatus(tasks));
  }, [tasks]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function columnOf(id: string): TaskStatus | null {
    if (COLUMNS.some((c) => c.status === id)) return id as TaskStatus;
    for (const col of COLUMNS) {
      if (columns[col.status].some((t) => t.id === id)) return col.status;
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    const activeCol = columnOf(activeId);
    const overCol = columnOf(overId);
    if (!activeCol || !overCol || activeCol === overCol) return;

    setColumns((prev) => {
      const activeItems = prev[activeCol];
      const overItems = prev[overCol];
      const activeIndex = activeItems.findIndex((t) => t.id === activeId);
      if (activeIndex === -1) return prev;
      const movingTask = activeItems[activeIndex];
      const overIndex = overItems.findIndex((t) => t.id === overId);
      const insertIndex = overIndex >= 0 ? overIndex : overItems.length;
      return {
        ...prev,
        [activeCol]: activeItems.filter((t) => t.id !== activeId),
        [overCol]: [...overItems.slice(0, insertIndex), movingTask, ...overItems.slice(insertIndex)],
      };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    const activeCol = columnOf(activeId);
    if (!activeCol) return;
    const overCol = columnOf(overId) ?? activeCol;

    let finalItems = columns[overCol];
    if (activeCol === overCol) {
      const oldIndex = finalItems.findIndex((t) => t.id === activeId);
      const newIndex = finalItems.findIndex((t) => t.id === overId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        finalItems = arrayMove(finalItems, oldIndex, newIndex);
        setColumns((prev) => ({ ...prev, [overCol]: finalItems }));
      }
    }

    const orderedIds = finalItems.map((t) => t.id);
    moveTaskAction(activeId, overCol, orderedIds).then((result) => {
      if (!result.success) toast.error(result.error);
    });
  }

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { title: "", room: "", assignedToId: "" },
  });

  async function onSubmit(data: CreateTaskInput) {
    const result = editingTask ? await updateTaskAction(editingTask.id, data) : await createTaskAction(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(editingTask ? "Tarefa atualizada." : "Tarefa criada.");
    reset();
    setEditingTask(null);
    setOpen(false);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    reset({ title: task.title, room: task.room, assignedToId: task.assignedTo?.id ?? "" });
    setOpen(true);
  }

  async function cycleStatus(task: Task) {
    setPendingTaskId(task.id);
    const result = await updateTaskStatusAction(task.id, NEXT_STATUS[task.status]);
    setPendingTaskId(null);
    if (!result.success) toast.error(result.error);
  }

  async function removeTask(task: Task) {
    setPendingTaskId(task.id);
    const result = await deleteTaskAction(task.id);
    setPendingTaskId(null);
    if (!result.success) toast.error(result.error);
  }

  const visibleColumns = useMemo(() => {
    if (!searchQuery.trim()) return columns;
    return {
      [TaskStatus.TODO]: columns[TaskStatus.TODO].filter((t) => matchesQuery(searchQuery, t.title, t.room, t.assignedTo?.name)),
      [TaskStatus.IN_PROGRESS]: columns[TaskStatus.IN_PROGRESS].filter((t) => matchesQuery(searchQuery, t.title, t.room, t.assignedTo?.name)),
      [TaskStatus.DONE]: columns[TaskStatus.DONE].filter((t) => matchesQuery(searchQuery, t.title, t.room, t.assignedTo?.name)),
    };
  }, [columns, searchQuery]);

  const activeCount = tasks.filter((t) => t.status !== TaskStatus.DONE).length;

  return (
    <>
      <TopBar
        title="Tarefas da casa"
        subtitle={`${activeCount} ${activeCount === 1 ? "tarefa ativa" : "tarefas ativas"} entre a família`}
        action={
          <Dialog
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (!next) {
                reset();
                setEditingTask(null);
              }
            }}
          >
            <DialogTrigger
              render={
                <Button
                  className="gap-2 shadow-sm"
                  onClick={() => {
                    setEditingTask(null);
                    reset({ title: "", room: "", assignedToId: "" });
                  }}
                />
              }
            >
              <Plus className="size-4" />
              Adicionar
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTask ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
                <DialogDescription>
                  {editingTask ? "Atualize os dados da tarefa." : "Crie uma tarefa para a família."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" {...register("title")} />
                  {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="room">Cômodo</Label>
                  <Input id="room" placeholder="Cozinha" {...register("room")} />
                  {errors.room && <p className="text-sm text-destructive">{errors.room.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="assignedToId">Responsável</Label>
                  <Controller
                    control={control}
                    name="assignedToId"
                    render={({ field }) => (
                      <Select
                        value={field.value || "none"}
                        onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                      >
                        <SelectTrigger id="assignedToId" className="w-full">
                          <SelectValue placeholder="Ninguém">
                            {(value: string) =>
                              !value || value === "none" ? "Ninguém" : members.find((m) => m.id === value)?.name
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Ninguém</SelectItem>
                          {members.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Salvando..." : editingTask ? "Salvar" : "Criar tarefa"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="ds-page" style={{ padding: "26px 36px 56px" }}>
        <DndContext
          id="tarefas-kanban"
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="ds-cols-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, alignItems: "start" }}>
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.status}
                status={col.status}
                label={col.label}
                color={col.color}
                tasks={visibleColumns[col.status]}
                pendingTaskId={pendingTaskId}
                onCycle={cycleStatus}
                onEdit={openEdit}
                onDelete={removeTask}
              />
            ))}
          </div>
          <DragOverlay>{activeTask && <TaskCardContent task={activeTask} dragging />}</DragOverlay>
        </DndContext>
      </div>
    </>
  );
}

function KanbanColumn({
  status,
  label,
  color,
  tasks,
  pendingTaskId,
  onCycle,
  onEdit,
  onDelete,
}: {
  status: TaskStatus;
  label: string;
  color: string;
  tasks: Task[];
  pendingTaskId: string | null;
  onCycle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div ref={setNodeRef} style={{ background: "var(--ds-soft)", borderRadius: 16, padding: "6px 6px 12px", minHeight: 120 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 14px 11px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, flexShrink: 0 }} />
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--ds-text)" }}>{label}</h3>
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--ds-muted)",
            background: "var(--ds-surface)",
            borderRadius: 20,
            padding: "2px 9px",
          }}
        >
          {tasks.length}
        </span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} pendingTaskId={pendingTaskId} onCycle={onCycle} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function TaskCard({
  task,
  pendingTaskId,
  onCycle,
  onEdit,
  onDelete,
}: {
  task: Task;
  pendingTaskId: string | null;
  onCycle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        opacity: pendingTaskId === task.id || isDragging ? 0.5 : 1,
        transition: "opacity 0.15s",
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        cursor: "grab",
        touchAction: "none",
      }}
    >
      <TaskCardContent task={task} onCycle={onCycle} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

function TaskCardContent({
  task,
  onCycle,
  onEdit,
  onDelete,
  dragging,
}: {
  task: Task;
  onCycle?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  dragging?: boolean;
}) {
  const done = task.status === TaskStatus.DONE;

  return (
    <div
      style={{
        background: "var(--ds-surface)",
        border: "1px solid var(--ds-border)",
        borderRadius: 13,
        padding: "14px 15px",
        boxShadow: dragging ? "0 6px 18px rgba(30,28,24,.15)" : "0 1px 2px rgba(30,28,24,.03)",
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1.35,
          textDecoration: done ? "line-through" : "none",
          color: done ? "var(--ds-muted)" : "var(--ds-text)",
        }}
      >
        {task.title}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 13 }}>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: "var(--ds-muted)",
            background: "var(--ds-soft)",
            borderRadius: 7,
            padding: "3px 9px",
          }}
        >
          {task.room}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {onEdit && (
            <QuietAction onClick={() => onEdit(task)}>
              Editar
            </QuietAction>
          )}
          {onDelete && (
            <QuietAction danger onClick={() => onDelete(task)}>
              Apagar
            </QuietAction>
          )}
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onCycle?.(task)}
            title="Avançar status"
            style={{
              width: 25,
              height: 25,
              borderRadius: "50%",
              background: done ? "#4f8a6b" : (task.assignedTo?.avatarColor ?? "#9a958b"),
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: dragging ? "default" : "pointer",
            }}
          >
            {task.assignedTo ? initials(task.assignedTo.name) : "?"}
          </div>
        </div>
      </div>
    </div>
  );
}
