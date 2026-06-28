import { prisma } from "../../config/database";

export const getConversations = async (userId: string) => {
  // Ne retourner que les convs où l'user n'a pas soft-deleted
  const convs = await prisma.conversation.findMany({
    where: {
      members: { some: { userId, deletedAt: null } },
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

  // Filtrer les messages supprimés pour cet user
  return convs.map((conv) => ({
    ...conv,
    messages: conv.messages.filter(
      (m: (typeof conv.messages)[number]) => !m.deletedForIds.includes(userId),
    ),
  }));
};

export const getMessages = async (
  conversationId: string,
  userId: string,
  page = 1,
) => {
  const member = await prisma.conversationMember.findUnique({
    where: { userId_conversationId: { userId, conversationId } },
  });
  if (!member) throw { status: 403, message: "Accès non autorisé" };

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      // Ne pas retourner les messages supprimés pour cet user
      NOT: { deletedForIds: { has: userId } },
      // Si l'user a soft-deleted la conv, ne montrer que les messages après
      ...(member.deletedAt ? { createdAt: { gt: member.deletedAt } } : {}),
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * 30,
    take: 30,
    include: {
      sender: {
        select: { id: true, username: true, avatarUrl: true },
      },
    },
  });

  return messages;
};

export const createPrivateConversation = async (
  userId: string,
  targetUserId: string,
) => {
  // Vérifier si une conv privée existe déjà (même si soft-deleted)
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

  if (existing) {
    // Réactiver si l'user avait soft-deleted
    await prisma.conversationMember.updateMany({
      where: { conversationId: existing.id, userId },
      data: { deletedAt: null },
    });
    return existing;
  }

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

// Soft-delete d'une conversation pour un user (l'autre garde la conv)
export const deleteConversationForUser = async (
  conversationId: string,
  userId: string,
) => {
  const member = await prisma.conversationMember.findUnique({
    where: { userId_conversationId: { userId, conversationId } },
  });
  if (!member) throw { status: 403, message: "Accès non autorisé" };

  await prisma.conversationMember.update({
    where: { userId_conversationId: { userId, conversationId } },
    data: { deletedAt: new Date() },
  });
};

// Supprimer un message pour tout le monde (seulement l'expéditeur peut le faire)
export const deleteMessageForEveryone = async (
  messageId: string,
  userId: string,
) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });
  if (!message) throw { status: 404, message: "Message introuvable" };
  if (message.senderId !== userId)
    throw {
      status: 403,
      message: "Tu ne peux supprimer que tes propres messages",
    };

  // Remplacer le contenu par un marqueur de suppression
  return prisma.message.update({
    where: { id: messageId },
    data: {
      content: "__deleted__",
      deletedForIds: ["__everyone__"],
    },
    include: {
      sender: { select: { id: true, username: true, avatarUrl: true } },
    },
  });
};
