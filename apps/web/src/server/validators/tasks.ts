import { z } from "zod";
import { entityIdSchema, shortTextSchema } from "./common";

export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE"]);

export const createTaskSchema = z.object({
  title: shortTextSchema("Informe o título da tarefa."),
  room: shortTextSchema("Informe o cômodo."),
  assignedToId: z.string().trim().max(64).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema;

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const updateTaskStatusSchema = z.object({
  taskId: entityIdSchema,
  status: taskStatusSchema,
});

export const moveTaskSchema = z.object({
  taskId: entityIdSchema,
  status: taskStatusSchema,
  orderedIds: z.array(entityIdSchema).max(200),
});
