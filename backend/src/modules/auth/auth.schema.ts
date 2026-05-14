import { z } from "zod";

const TERRITORIES = [
  "Nouvelle-Calédonie",
  "Wallis-et-Futuna",
  "Polynésie française",
  "Martinique",
  "Guadeloupe",
  "Guyane",
  "La Réunion",
  "Mayotte",
] as const;

export const registerSchema = z.object({
  email: z.string().email("Email invalide").toLowerCase().trim(),
  username: z
    .string()
    .min(3, "Minimum 3 caractères")
    .max(30, "Maximum 30 caractères")
    .regex(/^[a-zA-Z0-9_]+$/, "Lettres, chiffres et underscores uniquement"),
  password: z
    .string()
    .min(8, "Minimum 8 caractères")
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[0-9]/, "Au moins un chiffre")
    .regex(/[^a-zA-Z0-9]/, "Au moins un caractère spécial"),
  // Zod v4 : "error" remplace "errorMap"
  originTerritory: z.enum(TERRITORIES, {
    error: "Territoire invalide",
  }),
});

export const loginSchema = z.object({
  email: z.string().email("Email invalide").toLowerCase().trim(),
  password: z.string().min(1, "Mot de passe requis"),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
