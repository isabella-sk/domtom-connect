import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/src/tests/**/*.test.ts"],

  // setupFiles : s'exécute AVANT tout import de module
  // → définit les variables d'environnement pour la BDD test
  setupFiles: ["./src/tests/envSetup.ts"],

  // setupFilesAfterEnv : s'exécute APRÈS l'installation du framework Jest,
  // avant chaque fichier de test > c'est ici que vivent les hooks globaux
  setupFilesAfterEnv: ["./src/tests/setup.ts"],

  // On mesure la couverture uniquement sur le périmètre réellement testé.
  // Chat (WebSocket), admin (CRUD complet), cloudinary.ts et geocoding.service.ts
  // sont volontairement exclus : hors périmètre, testés manuellement.
  collectCoverageFrom: [
    "src/modules/auth/**/*.ts",
    "src/modules/posts/**/*.ts",
    "src/modules/scam/**/*.ts",
    "src/modules/tips/**/*.ts",
    "src/modules/users/**/*.ts",
    "src/middlewares/**/*.ts",
    "src/utils/jwt.ts",
    "!src/**/*.router.ts",
    "!src/**/*.schema.ts",
  ],

  coverageThreshold: {
    global: { lines: 55, functions: 50 },
  },
};

export default config;
