import request from "supertest";
import app from "../app";

// Types
export interface TestUser {
  id: string;
  email: string;
  username: string;
  accessToken: string;
}

//Factories
let userCounter = 0;

/**
 * Crée et inscrit un utilisateur de test via l'API.
 * Chaque appel génère un email/username unique pour éviter les conflits.
 */
export const createUser = async (
  overrides: Partial<{
    email: string;
    username: string;
    password: string;
    originTerritory: string;
  }> = {},
): Promise<TestUser & { password: string }> => {
  const n = ++userCounter;
  const payload = {
    email: overrides.email ?? `test${n}@example.com`,
    username: overrides.username ?? `testuser${n}`,
    password: overrides.password ?? "Password123!",
    originTerritory: overrides.originTerritory ?? "Martinique",
  };

  const res = await request(app).post("/api/auth/register").send(payload);

  if (res.status !== 201) {
    throw new Error(
      `createUser failed (${res.status}): ${JSON.stringify(res.body)}`,
    );
  }

  return {
    id: res.body.user.id,
    email: payload.email,
    username: payload.username,
    password: payload.password,
    accessToken: res.body.accessToken,
  };
};

/**
 * Crée un utilisateur admin.
 * Workaround : on crée l'user normalement puis on le passe admin via Prisma.
 */
export const createAdminUser = async (): Promise<
  TestUser & { password: string }
> => {
  // Import ici pour éviter les imports circulaires dans les tests
  const { prisma } = await import("../config/database");
  const user = await createUser({
    username: `admin${Date.now()}`,
    email: `admin${Date.now()}@example.com`,
  });
  await prisma.user.update({ where: { id: user.id }, data: { isAdmin: true } });

  // Re-login pour obtenir un token avec les bons droits
  // (le token existant ne reflète pas isAdmin, c'est le middleware qui re-vérifie en BDD)
  return user;
};

/**
 * Retourne les headers Authorization pour supertest.
 */
export const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});
