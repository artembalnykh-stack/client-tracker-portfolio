import { z } from "zod";

const optionalEmail = z
  .union([z.literal(""), z.email("Некорректный email")])
  .optional()
  .default("");

export const clientCreateSchema = z.object({
  name: z.string().trim().min(1, "Введите имя клиента").max(120),
  company: z.string().trim().max(120).optional().default(""),
  email: optionalEmail,
});

export const inviteTokenSchema = z.string().min(20).max(200);
