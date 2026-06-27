import { useEffect, useRef, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null); // useRef évite de recréer un socket à chaque re-render
  const { accessToken } = useAuthStore();
  const { addMessage, setTyping, setUserOnline, setUserOffline } =
    useChatStore();

  useEffect(() => {
    if (!accessToken) return;
    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token: accessToken }, // JWT dans le handshake
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket] Connecté:", socket.id);
    });

    // Nouveau mssg > MAJ du store Zustand
    socket.on("new_message", (message) => {
      addMessage(message);
    });

    // Indicateur de frappe avec auto-stop 3s
    socket.on("user_typing", ({ userId, conversationId }) => {
      setTyping(conversationId, userId, true);
      // Auto-stop si le serveur ne reçoit pas stop_typing
      setTimeout(() => setTyping(conversationId, userId, false), 3000);
    });

    socket.on("user_stop_typing", ({ userId, conversationId }) => {
      setTyping(conversationId, userId, false);
    });

    // Présence en ligne (Redis TTL côté serveur)
    socket.on("user_online", ({ userId }) => setUserOnline(userId));
    socket.on("user_offline", ({ userId }) => setUserOffline(userId));

    socket.on("connect_error", (err) => {
      console.error("[Socket] Erreur connexion:", err.message);
    });

    socket.on("error", ({ message }) => {
      console.error("[Socket] Erreur:", message);
    });

    // Nettoyage au démontage du composant
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken]); // se reconnecte si le token change

  const sendMessage = useCallback((conversationId: string, content: string) => {
    socketRef.current?.emit("send_message", { conversationId, content });
  }, []);

  const emitTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit("typing", { conversationId });
  }, []);

  const emitStopTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit("stop_typing", { conversationId });
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit("join_conversation", conversationId);
  }, []);

  const markRead = useCallback((conversationId: string) => {
    socketRef.current?.emit("mark_read", { conversationId });
  }, []);

  return {
    sendMessage,
    emitTyping,
    emitStopTyping,
    joinConversation,
    markRead,
  };
};
