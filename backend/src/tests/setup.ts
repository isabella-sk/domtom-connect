import { prisma } from "../config/database";

// Après chaque test individuel : vide les tables dans l'ordre (FK)
afterEach(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.scamReport.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
});

// Après tous les tests du fichier : déconnexion Prisma
afterAll(async () => {
  await prisma.$disconnect();
});
