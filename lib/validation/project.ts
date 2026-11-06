import { z } from "zod";

export const projectCreateSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().trim().min(1, "Введите название проекта").max(160),
  description: z.string().trim().max(2000).optional().default(""),
});
