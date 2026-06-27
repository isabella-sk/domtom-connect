import { Server, Socket } from "socket.io";
import { prisma } from "../../config/database";
import { redisClient } from "../../config/redis";
import { verifyAccessToken } from "../../utils/jwt";

const ONLINE_TTL = 300;

export const initSocketHandlers = (io: Server) => {
  // MIDDLEWARE D'AUTHENTIFICATION
  // Chaque connexion WebSocket doit présenter un token valide
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) return next(new Error("Token requis"));
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error("Token invalide"));
    }
  });

  // CONNEXION ÉTABLIE
  io.on("connection", async (socket: Socket) => {
    const userId = socket.data.userId as string;
    console.log(`👤 [Socket] User ${userId} connecté - socket ${socket.id}`);

    // 1. Marquer l'user en ligne dans Redis
    await redisClient.setex(`user:online:${userId}`, ONLINE_TTL, "1");
    // Notifie tous les connectés
    io.emit("user_online", { userId });

    // 2. Rejoindre toutes ses conversations existantes
    const memberships = await prisma.conversationMember.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    memberships.forEach((m) => socket.join(`conv:${m.conversationId}`));
    // Room personnelle pour recevoir des notifications directes
    socket.join(`user:${userId}`);

    // 3. Heartbeat : renouvelle la présence toutes les 4 minutes
    const heartbeat = setInterval(
      async () => {
        await redisClient.setex(`user:online:${userId}`, ONLINE_TTL, "1");
      },
      4 * 60 * 1000,
    );

    // EVENT ÉMIS PAR LE CLIENT

    // Envoyer un message
    socket.on(
      "send_message",
      async ({
        conversationId,
        content,
      }: {
        conversationId: string;
        content: string;
      }) => {
        if (!content?.trim()) return;

        try {
          // Vérifie que l'user est bien membre
          const isMember = await prisma.conversationMember.findUnique({
            where: { userId_conversationId: { userId, conversationId } },
          });
          if (!isMember) {
            socket.emit("error", {
              message: "Accès non autorisé à cette conversation",
            });
            return;
          }

          // Sauvegarde en BDD
          const message = await prisma.message.create({
            data: { content: content.trim(), senderId: userId, conversationId },
            include: {
              sender: { select: { id: true, username: true, avatarUrl: true } },
            },
          });

          // Met à jour updatedAt de la conversation (pour tri côté client)
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
          });

          // Réactiver la conv pour les membres qui l'avaient soft-deleted
          await prisma.conversationMember.updateMany({
            where: { conversationId, deletedAt: { not: null } },
            data: { deletedAt: null },
          });

          io.to(`conv:${conversationId}`).emit("new_message", {
            ...message,
            conversationId,
          });
        } catch (err) {
          console.error("[Socket] send_message:", err);
        }
      },
    );

    // Supprimer un message (pour tout le monde)
    socket.on(
      "delete_message",
      async ({
        messageId,
        conversationId,
      }: {
        messageId: string;
        conversationId: string;
      }) => {
        try {
          const message = await prisma.message.findUnique({
            where: { id: messageId },
          });
          if (!message) return;
          if (message.senderId !== userId) {
            socket.emit("error", {
              message: "Tu ne peux supprimer que tes propres messages",
            });
            return;
          }

          // Marquer comme supprimé pour tout le monde
          const updated = await prisma.message.update({
            where: { id: messageId },
            data: {
              content: "__deleted__",
              deletedForIds: ["__everyone__"],
            },
            include: {
              sender: { select: { id: true, username: true, avatarUrl: true } },
            },
          });

          // Notifier tous les membres de la conv
          io.to(`conv:${conversationId}`).emit("message_deleted", {
            messageId,
            conversationId,
            message: updated,
          });
        } catch (err) {
          console.error("[Socket] delete_message:", err);
        }
      },
    );

    // Typing indicators
    socket.on("typing", ({ conversationId }: { conversationId: string }) => {
      socket
        .to(`conv:${conversationId}`)
        .emit("user_typing", { userId, conversationId });
    });

    socket.on(
      "stop_typing",
      ({ conversationId }: { conversationId: string }) => {
        socket
          .to(`conv:${conversationId}`)
          .emit("user_stop_typing", { userId, conversationId });
      },
    );

    // Rejoindre une conversation
    socket.on("join_conversation", (conversationId: string) => {
      socket.join(`conv:${conversationId}`);
    });

    // Marquer les messages comme lu
    socket.on(
      "mark_read",
      async ({ conversationId }: { conversationId: string }) => {
        try {
          await prisma.message.updateMany({
            where: { conversationId, readAt: null, NOT: { senderId: userId } },
            data: { readAt: new Date() },
          });
        } catch (err) {
          console.error("[Socket] mark_read:", err);
        }
      },
    );

    // Déconnexion
    socket.on("disconnect", async (reason) => {
      clearInterval(heartbeat);
      await redisClient.del(`user:online:${userId}`);
      io.emit("user_offline", { userId });
      console.log(`👤 [Socket] User ${userId} déconnecté — raison: ${reason}`);
    });
  });
};
