import { z } from "zod";

export const CATEGORIES = [
  "logement",
  "caf",
  "sante",
  "banque",
  "transport",
  "telephone",
  "crous",
  "autre",
] as const;

// Schema de création - compatible avec multipart (isPinned peut être "true"/"false")
export const createPostSchema = z.object({
  title: z
    .string()
    .min(5, "Minimum 5 caractères")
    .max(150, "Maximum 150 caractères"),
  content: z
    .string()
    .min(20, "Minimum 20 caractères")
    .max(10000, "Maximum 10000 caractères"),
  category: z.enum(CATEGORIES, { error: "Catégorie invalide" }),
  // isPinned peut arriver comme boolean ou string "true"/"false" via FormData
  isPinned: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .optional()
    .default(false)
    .transform((v) => v === true || v === "true"),
  // links est un JSON string optionnel
  links: z.string().optional(),
});

export const updatePostSchema = z.object({
  title: z
    .string()
    .min(5, "Minimum 5 caractères")
    .max(150, "Maximum 150 caractères")
    .optional(),
  content: z
    .string()
    .min(20, "Minimum 20 caractères")
    .max(10000, "Maximum 10000 caractères")
    .optional(),
  category: z.enum(CATEGORIES, { error: "Catégorie invalide" }).optional(),
  isPinned: z.boolean().optional(),
});

export type CreatePostDto = z.infer<typeof createPostSchema>;
export type UpdatePostDto = z.infer<typeof updatePostSchema>;
