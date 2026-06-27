import { create } from "zustand";

export interface MessageSender {
  id: string;
  username: string;
  avatarUrl?: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  readAt?: string | null;
  deletedForIds?: string[];
  createdAt: string;
  sender: MessageSender;
}

export interface ConvMember {
  user: { id: string; username: string; avatarUrl?: string };
}

export interface Conversation {
  id: string;
  type: string;
  name?: string;
  updatedAt: string;
  members: ConvMember[];
  messages: Message[];
}

interface ChatState {
  conversations: Conversation[];
  activeConvId: string | null;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, string[]>;
  onlineUsers: Set<string>;

  setConversations: (convs: Conversation[]) => void;
  addConversation: (conv: Conversation) => void;
  setActiveConv: (id: string | null) => void;
  addMessage: (msg: Message) => void;
  setMessages: (convId: string, msgs: Message[]) => void;
  updateMessage: (
    convId: string,
    msgId: string,
    patch: Partial<Message>,
  ) => void;
  // Efface le cache messages d'une conv (après soft-delete côté client)
  clearMessages: (convId: string) => void;
  setTyping: (convId: string, userId: string, on: boolean) => void;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  reset: () => void;
}

const initial = {
  conversations: [],
  activeConvId: null,
  messages: {},
  typingUsers: {},
  onlineUsers: new Set<string>(),
};

export const useChatStore = create<ChatState>()((set) => ({
  ...initial,

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conv) =>
    set((s) => ({
      conversations: s.conversations.some((c) => c.id === conv.id)
        ? s.conversations
        : [conv, ...s.conversations],
    })),

  setActiveConv: (activeConvId) => set({ activeConvId }),

  addMessage: (msg) =>
    set((s) => {
      const existing = s.messages[msg.conversationId] || [];
      if (existing.some((m) => m.id === msg.id)) return s;
      return {
        messages: {
          ...s.messages,
          [msg.conversationId]: [...existing, msg],
        },
      };
    }),

  setMessages: (convId, msgs) =>
    set((s) => ({ messages: { ...s.messages, [convId]: msgs } })),

  // Patch partiel d'un message existant (ex : marquer supprimé)
  updateMessage: (convId, msgId, patch) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [convId]: (s.messages[convId] ?? []).map((m) =>
          m.id === msgId ? { ...m, ...patch } : m,
        ),
      },
    })),

  // Efface le cache d'une conversation (soft-delete côté client)
  // Ainsi si l'user recrée la conv, les messages sont rechargés depuis le backend
  // qui ne retourne que les messages APRÈS la date de suppression
  clearMessages: (convId) =>
    set((s) => {
      const next = { ...s.messages };
      delete next[convId];
      return { messages: next };
    }),

  setTyping: (convId, userId, on) =>
    set((s) => ({
      typingUsers: {
        ...s.typingUsers,
        [convId]: on
          ? [
              ...(s.typingUsers[convId] || []).filter((id) => id !== userId),
              userId,
            ]
          : (s.typingUsers[convId] || []).filter((id) => id !== userId),
      },
    })),

  setUserOnline: (userId) =>
    set((s) => ({ onlineUsers: new Set([...s.onlineUsers, userId]) })),

  setUserOffline: (userId) =>
    set((s) => {
      const next = new Set(s.onlineUsers);
      next.delete(userId);
      return { onlineUsers: next };
    }),

  reset: () => set(initial),
}));
