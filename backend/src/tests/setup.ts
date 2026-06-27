import { prisma } from "../config/database";
import { redisClient } from "../config/redis";

// Connexion Redis avant les tests
beforeAll(async () => {
  await redisClient.connect();
});

// Nettoyage entre chaque test
afterEach(async () => {
  await prisma.conversation.deleteMany();
  await prisma.user.deleteMany();
  await redisClient.flushdb();
});

// Fermeture propre
afterAll(async () => {
  await prisma.$disconnect();
  await redisClient.quit();
});
