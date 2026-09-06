import prisma, { TaskStatus } from "@bethel/db";
import type { CreateTaskInput } from "@/server/validators/tasks";

export async function getTasks(familyId: string) {
  const tasks = await prisma.task.findMany({
    where: { familyId },
    include: { assignedTo: { select: { id: true, name: true, avatarColor: true } } },
    orderBy: [{ status: "asc" }, { position: "asc" }],
  });

  return tasks.map((task) => ({
    ...task,
    assignedTo: task.assignedTo
      ? { ...task.assignedTo, avatarColor: task.assignedTo.avatarColor ?? "#9a958b" }
      : null,
  }));
}

export async function createTask(familyId: string, input: CreateTaskInput) {
  const lastPosition = await prisma.task.count({
    where: { familyId, status: TaskStatus.TODO },
  });

  return prisma.task.create({
    data: {
      familyId,
      title: input.title,
      room: input.room,
      assignedToId: input.assignedToId || null,
      status: TaskStatus.TODO,
      position: lastPosition,
    },
  });
}

export async function updateTask(familyId: string, taskId: string, input: CreateTaskInput) {
  const result = await prisma.task.updateMany({
    where: { id: taskId, familyId },
    data: {
      title: input.title,
      room: input.room,
      assignedToId: input.assignedToId || null,
    },
  });

  if (result.count === 0) {
    throw new Error("Tarefa não encontrada.");
  }
}

export async function updateTaskStatus(familyId: string, taskId: string, status: TaskStatus) {
  const result = await prisma.task.updateMany({
    where: { id: taskId, familyId },
    data: { status },
  });

  if (result.count === 0) {
    throw new Error("Tarefa não encontrada.");
  }
}

export async function moveTask(familyId: string, taskId: string, status: TaskStatus, orderedIds: string[]) {
  const count = await prisma.task.count({ where: { familyId, id: { in: orderedIds } } });
  if (count !== orderedIds.length) {
    throw new Error("Tarefa não encontrada.");
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.task.update({
        where: { id },
        data: id === taskId ? { position: index, status } : { position: index },
      }),
    ),
  );
}

export async function deleteTask(familyId: string, taskId: string) {
  const result = await prisma.task.deleteMany({
    where: { id: taskId, familyId },
  });
  if (result.count === 0) throw new Error("Tarefa não encontrada.");
}
