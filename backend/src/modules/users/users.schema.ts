import { z } from "zod";

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Minimum 3 caractères")
    .max(30, "Maximum 30 caractères")
    .regex(/^[a-zA-Z0-9_]+$/, "Lettres, chiffres et underscores uniquement")
    .optional(),
  bio: z.string().max(300, "Maximum 300 caractères").optional(),
  currentCity: z.string().max(100).optional(),
  showOnMap: z.boolean().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
