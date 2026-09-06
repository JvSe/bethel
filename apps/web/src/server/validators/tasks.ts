import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Informe o título da tarefa."),
  room: z.string().trim().min(1, "Informe o cômodo."),
  assignedToId: z.string().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema;

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
