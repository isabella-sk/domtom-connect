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

  // Ajoute un message sans doublon
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
