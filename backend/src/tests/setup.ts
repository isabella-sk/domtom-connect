import { prisma } from "../config/database";
import { redisClient } from "../config/redis";

beforeAll(async () => {
  await prisma.$connect();
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
