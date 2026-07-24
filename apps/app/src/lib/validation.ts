import { z } from "zod";

export const eventCreateSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório").max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  event_date: z.string().datetime({ offset: true }).or(z.string().min(1)),
  location: z.string().trim().max(300).optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  max_people: z.coerce.number().int().min(1).max(100000).default(25),
  anti_penetra: z.boolean().default(false),
});

export const eventUpdateSchema = eventCreateSchema.partial();

export const rsvpConfirmSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(200),
  contact: z.string().trim().max(200).optional().nullable(),
  companions: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Nome do acompanhante é obrigatório").max(200),
      }),
    )
    .max(50)
    .default([]),
});

export const rsvpResponseSchema = z.object({
  response: z.enum(["yes", "no", "pending"]),
  name: z.string().trim().min(1).max(200).optional(),
  contact: z.string().trim().max(200).optional().nullable(),
});
