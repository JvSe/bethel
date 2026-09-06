"use server";

import { TaskStatus } from "@bethel/db";
import { revalidatePath } from "next/cache";
import { requireFamilySession } from "@/server/auth";
import { createTask, deleteTask, moveTask, updateTask, updateTaskStatus } from "@/server/data/tasks";
import { createTaskSchema } from "@/server/validators/tasks";

type ActionResult = { success: true } | { success: false; error: string };

function revalidateTarefas() {
  revalidatePath("/tarefas");
  revalidatePath("/inicio");
}

export async function createTaskAction(input: unknown): Promise<ActionResult> {
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { familyId } = await requireFamilySession();
  await createTask(familyId, parsed.data);
  revalidateTarefas();
  return { success: true };
}

export async function updateTaskAction(taskId: string, input: unknown): Promise<ActionResult> {
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { familyId } = await requireFamilySession();
  try {
    await updateTask(familyId, taskId, parsed.data);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar tarefa." };
  }
  revalidateTarefas();
  return { success: true };
}

export async function moveTaskAction(taskId: string, status: TaskStatus, orderedIds: string[]): Promise<ActionResult> {
  const { familyId } = await requireFamilySession();

  try {
    await moveTask(familyId, taskId, status, orderedIds);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao mover tarefa." };
  }

  revalidateTarefas();
  return { success: true };
}

export async function updateTaskStatusAction(taskId: string, status: TaskStatus): Promise<ActionResult> {
  const { familyId } = await requireFamilySession();

  try {
    await updateTaskStatus(familyId, taskId, status);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar tarefa." };
  }

  revalidateTarefas();
  return { success: true };
}

export async function deleteTaskAction(taskId: string): Promise<ActionResult> {
  const { familyId } = await requireFamilySession();
  try {
    await deleteTask(familyId, taskId);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao apagar tarefa." };
  }
  revalidateTarefas();
  return { success: true };
}
