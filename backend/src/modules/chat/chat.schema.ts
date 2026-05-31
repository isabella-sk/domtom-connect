import { z } from "zod";

export const createPrivateConvSchema = z.object({
  targetUserId: z.string().uuid("ID utilisateur invalide"),
});

export const createGroupConvSchema = z.object({
  name: z
    .string()
    .min(3, "Minimum 3 caractères")
    .max(50, "Maximum 50 caractères"),
  memberIds: z
    .array(z.string().uuid("ID invalide"))
    .min(1, "Au moins un membre requis")
    .max(49, "Maximum 49 membres"),
});

export type CreatePrivateConvDto = z.infer<typeof createPrivateConvSchema>;
export type CreateGroupConvDto = z.infer<typeof createGroupConvSchema>;
