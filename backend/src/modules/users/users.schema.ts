import { z } from "zod";

export const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  bio: z.string().max(300).optional().nullable(),
  currentCity: z.string().max(100).optional().nullable(),
  showOnMap: z.boolean().optional(),
  // "everyone" | "followers" | "none"
  mapVisibility: z.enum(["everyone", "followers", "none"]).optional(),
  // Coordonnées mises à jour si l'user active la carte
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
