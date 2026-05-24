import { prisma } from "../../config/database";

export const getConversations = async (userId: string) => {
  return prisma.conversation.findMany({
    where: {
      members: { some: { userId } },
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sender: { select: { id: true, username: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
};

export const getMessages = async (
  conversationId: string,
  userId: string,
  page = 1,
) => {
  // Vérifier que l'user est membre de cette conversation
  const isMember = await prisma.conversationMember.findUnique({
    where: {
      userId_conversationId: { userId, conversationId },
    },
  });
  if (!isMember) throw { status: 403, message: "Accès non autorisé" };

  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * 30,
    take: 30,
    include: {
      sender: {
        select: { id: true, username: true, avatarUrl: true },
      },
    },
  });
};

export const createPrivateConversation = async (
  userId: string,
  targetUserId: string,
) => {
  // Vérifier si une conv privée existe déjà entre ces deux users
  const existing = await prisma.conversation.findFirst({
    where: {
      type: "private",
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: targetUserId } } },
      ],
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      type: "private",
      members: {
        create: [{ userId }, { userId: targetUserId }],
      },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
};

export const createGroupConversation = async (
  name: string,
  creatorId: string,
  memberIds: string[],
) => {
  const allMembers = [...new Set([creatorId, ...memberIds])];

  return prisma.conversation.create({
    data: {
      type: "group",
      name,
      members: {
        create: allMembers.map((userId) => ({ userId })),
      },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
      },
    },
  });
};
