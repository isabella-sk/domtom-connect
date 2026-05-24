import { z } from "zod";

const SCAM_CATEGORIES = [
  "logement",
  "banque",
  "emploi",
  "telephone",
  "identite",
  "autre",
] as const;

export const createScamSchema = z.object({
  title: z.string().min(5, "Minimum 5 caractères").max(150),
  description: z
    .string()
    .min(20, "Minimum 20 caractères")
    .max(2000, "Maximum 2000 caractères"),
  // Zod v4 : "error" à la place de "errorMap"
  category: z.enum(SCAM_CATEGORIES, {
    error: "Catégorie invalide",
  }),
});

export type CreateScamDto = z.infer<typeof createScamSchema>;
