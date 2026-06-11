import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/src/tests/**/*.test.ts"],

  // setupFiles : s'exécute AVANT tout import de module
  // → définit les variables d'environnement pour la BDD test
  setupFiles: ["./src/tests/envSetup.ts"],

  // setupFilesAfterFramework : s'exécute après Jest, avant chaque fichier
  // → ici les hooks beforeAll/afterEach/afterAll
  setupFilesAfterFramework: ["./src/tests/setup.ts"],

  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/server.ts",
    "!src/generated/**",
    "!src/tests/**",
    "!src/config/**",
  ],

  coverageThreshold: {
    global: { lines: 70, functions: 70 },
  },
};

export default config;
