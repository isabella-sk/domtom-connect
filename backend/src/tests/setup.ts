import { prisma } from "../config/database";
import { redisClient } from "../config/redis";

beforeAll(async () => {
  // Attendre que PostgreSQL soit prêt (important en CI avec PrismaPg)
  let retries = 10;
  while (retries > 0) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      break;
    } catch {
      retries--;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
});

afterEach(async () => {
  await prisma.scamAttachment.deleteMany();
  await prisma.scamReport.deleteMany();
  await prisma.tipAttachment.deleteMany();
  await prisma.tip.deleteMany();
  await prisma.postAttachment.deleteMany().catch(() => {});
  await prisma.post.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await redisClient.flushdb();
});

afterAll(async () => {
  await prisma.$disconnect();
  await redisClient.quit();
});
