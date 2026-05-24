import { z } from "zod";

const CATEGORIES = [
  "logement",
  "caf",
  "sante",
  "banque",
  "transport",
  "telephone",
  "crous",
  "autre",
] as const;

export const createPostSchema = z.object({
  title: z
    .string()
    .min(5, "Minimum 5 caractères")
    .max(150, "Maximum 150 caractères"),
  content: z
    .string()
    .min(20, "Minimum 20 caractères")
    .max(5000, "Maximum 5000 caractères"),
  // Zod v4 : "error" remplace "errorMap"
  category: z.enum(CATEGORIES, {
    error: "Catégorie invalide",
  }),
  isPinned: z.boolean().optional().default(false),
});

export const updatePostSchema = createPostSchema.partial();

export type CreatePostDto = z.infer<typeof createPostSchema>;
export type UpdatePostDto = z.infer<typeof updatePostSchema>;
