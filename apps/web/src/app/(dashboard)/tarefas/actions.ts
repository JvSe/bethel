"use server";

import { revalidatePath } from "next/cache";
import { requireFamilyAction } from "@/server/auth";
import { createTask, deleteTask, moveTask, updateTask, updateTaskStatus } from "@/server/data/tasks";
import { entityIdSchema } from "@/server/validators/common";
import { createTaskSchema, moveTaskSchema, updateTaskStatusSchema } from "@/server/validators/tasks";

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

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  try {
    await createTask(authz.session.familyId, parsed.data);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao criar tarefa." };
  }
  revalidateTarefas();
  return { success: true };
}

export async function updateTaskAction(taskId: string, input: unknown): Promise<ActionResult> {
  const parsed = createTaskSchema.safeParse(input);
  const id = entityIdSchema.safeParse(taskId);
  if (!parsed.success || !id.success) {
    return { success: false, error: parsed.error?.issues[0]?.message ?? "Dados inválidos." };
  }

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  try {
    await updateTask(authz.session.familyId, id.data, parsed.data);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar tarefa." };
  }
  revalidateTarefas();
  return { success: true };
}

export async function moveTaskAction(taskId: string, status: string, orderedIds: string[]): Promise<ActionResult> {
  const parsed = moveTaskSchema.safeParse({ taskId, status, orderedIds });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;

  try {
    await moveTask(authz.session.familyId, parsed.data.taskId, parsed.data.status, parsed.data.orderedIds);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao mover tarefa." };
  }

  revalidateTarefas();
  return { success: true };
}

export async function updateTaskStatusAction(taskId: string, status: string): Promise<ActionResult> {
  const parsed = updateTaskStatusSchema.safeParse({ taskId, status });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;

  try {
    await updateTaskStatus(authz.session.familyId, parsed.data.taskId, parsed.data.status);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar tarefa." };
  }

  revalidateTarefas();
  return { success: true };
}

export async function deleteTaskAction(taskId: string): Promise<ActionResult> {
  const id = entityIdSchema.safeParse(taskId);
  if (!id.success) return { success: false, error: "Tarefa inválida." };

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  try {
    await deleteTask(authz.session.familyId, id.data);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao apagar tarefa." };
  }
  revalidateTarefas();
  return { success: true };
}
