import { Server, Socket } from "socket.io";
import { prisma } from "../../config/database";
import { redisClient } from "../../config/redis";
import { verifyAccessToken } from "../../utils/jwt";

const ONLINE_TTL = 300; // 5min en secondes

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
    console.log(`👤 [Socket] User ${userId} connecté — socket ${socket.id}`);

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

          // Diffuse à TOUS les membres de la room (y compris l'émetteur)
          io.to(`conv:${conversationId}`).emit("new_message", {
            ...message,
            conversationId,
          });
        } catch (err) {
          console.error("[Socket] send_message:", err);
        }
      },
    );

    // Indicateur "en train d'écrire..."
    socket.on("typing", ({ conversationId }: { conversationId: string }) => {
      // Envoie à tous SAUF l'émetteur
      socket.to(`conv:${conversationId}`).emit("user_typing", {
        userId,
        conversationId,
      });
    });

    socket.on(
      "stop_typing",
      ({ conversationId }: { conversationId: string }) => {
        socket.to(`conv:${conversationId}`).emit("user_stop_typing", {
          userId,
          conversationId,
        });
      },
    );

    // Rejoindre une conversation créée après la connexion
    socket.on("join_conversation", (conversationId: string) => {
      socket.join(`conv:${conversationId}`);
      console.log(`[Socket] User ${userId} rejoint conv:${conversationId}`);
    });

    // Marquer les messages comme lus
    socket.on(
      "mark_read",
      async ({ conversationId }: { conversationId: string }) => {
        try {
          await prisma.message.updateMany({
            where: {
              conversationId,
              readAt: null,
              NOT: { senderId: userId },
            },
            data: { readAt: new Date() },
          });
        } catch (err) {
          console.error("[Socket] mark_read:", err);
        }
      },
    );

    // DÉCONNEXION
    socket.on("disconnect", async (reason) => {
      clearInterval(heartbeat);
      await redisClient.del(`user:online:${userId}`);
      io.emit("user_offline", { userId });
      console.log(`👤 [Socket] User ${userId} déconnecté — raison: ${reason}`);
    });
  });
};
