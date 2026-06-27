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
  description: z.string().min(20, "Minimum 20 caractères").max(2000),
  category: z.enum(SCAM_CATEGORIES, { error: "Catégorie invalide" }),
  // Les liens sont passés en JSON stringifié dans le body multipart
  links: z.string().optional(), // JSON array de { url: string, label?: string }
});

export type CreateScamDto = z.infer<typeof createScamSchema>;
