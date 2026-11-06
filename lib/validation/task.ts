import { z } from "zod";
import { PRIORITIES } from "@/lib/priority";
import { STATUS_CODES } from "@/lib/status";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Некорректная дата")
  .or(z.literal(""))
  .optional()
  .default("");

export const taskCreateSchema = z.object({
  project_id: z.string().uuid("Выберите проект"),
  title: z.string().trim().min(1, "Введите название").max(200),
  description: z.string().trim().max(5000).optional().default(""),
  priority: z.enum(PRIORITIES).default("normal"),
  deadline: dateString,
  status_code: z.enum(STATUS_CODES).default("new"),
});

export const taskUpdateSchema = taskCreateSchema.omit({ status_code: true });

export const taskMoveSchema = z.object({
  taskId: z.string().uuid(),
  toStatus: z.enum(STATUS_CODES),
  position: z.number().finite().min(0),
});

export const relationSchema = z.object({
  parentTaskId: z.string().uuid(),
  childTaskId: z.string().uuid(),
});
