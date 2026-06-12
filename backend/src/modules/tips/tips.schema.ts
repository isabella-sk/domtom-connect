import { z } from "zod";

export const createTipSchema = z.object({
  title: z
    .string()
    .min(5, "Minimum 5 caractères")
    .max(150, "Maximum 150 caractères"),
  content: z
    .string()
    .min(20, "Minimum 20 caractères")
    .max(3000, "Maximum 3000 caractères"),
  type: z.enum(["tip", "testimonial"], {
    error: "Type invalide - choisir 'tip' ou 'testimonial'",
  }),
});

export type CreateTipDto = z.infer<typeof createTipSchema>;
