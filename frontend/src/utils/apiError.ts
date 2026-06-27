/**
 * Centralise l'extraction d'un message d'erreur lisible, peu importe
 * la forme exacte de lerreur renvoyée par axios/backend
 * Formes possibles renvoyées par errorMiddleware.ts côté backend :
 *    { message: string }                                    -> erreurs métier (ex: status 409, 404...)
 *    { message: string, errors: Record<string, string[]> }  -> erreurs de validation Zod (status 400)
 *    { message: "Erreur serveur interne" }                  -> erreur 500 non gérée
 *
 *
 * Plus les cas où la requête échoue avant même d'atteindre le backend
 * (timeout, pas de réseau, CORS...).
 */

import { AxiosError } from "axios";

export interface ApiErrorPayload {
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

/**
 * Extrait un message d'erreur lisible pour l'utilisateur à partir de n'importe
 * quelle erreur catchée (erreur axios, erreur JS classique, ou autre).
 */
export function getApiErrorMessage(err: unknown): string {
  if (isAxiosErrorWithPayload(err)) {
    const payload = err.response?.data;

    // Erreurs de validation Zod : on prend le premier message de champ trouvé,
    // c'est plus parlant que le message générique "Données invalides"
    if (payload?.errors) {
      const firstFieldErrors = Object.values(payload.errors)[0];
      if (Array.isArray(firstFieldErrors) && firstFieldErrors.length > 0) {
        return firstFieldErrors[0];
      }
    }

    if (payload?.message) return payload.message;

    // La requête a atteint le serveur mais sans payload JSON exploitable
    if (err.response) {
      return `Erreur serveur (${err.response.status})`;
    }

    // La requête n'a jamais atteint le serveur
    if (err.code === "ECONNABORTED") {
      return "La requête a expiré, vérifie ta connexion.";
    }
    return "Impossible de contacter le serveur. Vérifie ta connexion.";
  }

  if (err instanceof Error) return err.message;

  return "Une erreur inattendue est survenue.";
}

/**
 * Récupère le détail des erreurs de validation par champ, si présent.
 * Utile pour afficher l'erreur sous le bon input plutôt qu'un message global.
 */
export function getApiFieldErrors(
  err: unknown,
): Record<string, string[]> | null {
  if (isAxiosErrorWithPayload(err)) {
    return err.response?.data?.errors ?? null;
  }
  return null;
}

function isAxiosErrorWithPayload(
  err: unknown,
): err is AxiosError<ApiErrorPayload> {
  return (
    typeof err === "object" &&
    err !== null &&
    "isAxiosError" in err &&
    (err as AxiosError).isAxiosError === true
  );
}
