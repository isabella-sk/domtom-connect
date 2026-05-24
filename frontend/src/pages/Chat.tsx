import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { useChatStore, type Conversation } from "../stores/chatStore";
import { useSocket } from "../hooks/userSocket";

export const Chat = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    conversations,
    setConversations,
    activeConvId,
    setActiveConv,
    messages,
    setMessages,
    typingUsers,
    onlineUsers,
    addConversation,
  } = useChatStore();
  const {
    sendMessage,
    emitTyping,
    emitStopTyping,
    joinConversation,
    markRead,
  } = useSocket();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api
      .get("/chat/conversations")
      .then((r) => setConversations(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeConvId) return;
    if (messages[activeConvId]?.length) return;
    setLoadingMsgs(true);
    api
      .get(`/chat/conversations/${activeConvId}/messages`)
      .then((r) => setMessages(activeConvId, r.data.reverse()))
      .catch(console.error)
      .finally(() => setLoadingMsgs(false));
  }, [activeConvId]);

  useEffect(() => {
    if (activeConvId) markRead(activeConvId);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeConvId]);

  const handleSelectConv = (convId: string) => {
    setActiveConv(convId);
    joinConversation(convId);
  };

  const handleSend = () => {
    if (!input.trim() || !activeConvId) return;
    sendMessage(activeConvId, input.trim());
    setInput("");
    emitStopTyping(activeConvId);
    if (typingTimer.current) clearTimeout(typingTimer.current);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!activeConvId) return;
    emitTyping(activeConvId);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitStopTyping(activeConvId), 2000);
  };

  const getConvName = (conv: Conversation) => {
    if (conv.type === "group") return conv.name ?? "Groupe";
    const other = conv.members.find((m) => m.user.id !== user?.id);
    return other?.user.username ?? "Conversation";
  };

  const getConvAvatar = (conv: Conversation) => {
    if (conv.type === "group") return conv.name?.[0]?.toUpperCase() ?? "G";
    const other = conv.members.find((m) => m.user.id !== user?.id);
    return other?.user.username?.[0]?.toUpperCase() ?? "?";
  };

  const activeMessages = activeConvId ? (messages[activeConvId] ?? []) : [];
  const typingInConv = activeConvId
    ? (typingUsers[activeConvId] ?? []).filter((id) => id !== user?.id)
    : [];

  return (
    <div style={{ display: "flex", height: "100vh", background: "#F9F9F7" }}>
      {/* ── Sidebar ─────────────────────────────── */}
      <div
        style={{
          width: 280,
          background: "#fff",
          borderRight: "0.5px solid #EAEAE8",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "16px 16px 12px",
            borderBottom: "0.5px solid #EAEAE8",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 500 }}>Messages</span>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              fontSize: 12,
              color: "#888",
              border: "none",
              background: "none",
              cursor: "pointer",
            }}
          >
            ← Retour
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div
              style={{
                textAlign: "center",
                color: "#aaa",
                padding: 20,
                fontSize: 13,
              }}
            >
              Chargement...
            </div>
          ) : conversations.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: "#aaa",
                padding: 20,
                fontSize: 13,
              }}
            >
              Aucune conversation.
              <br />
              Va sur le profil d'un étudiant pour démarrer.
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              const otherUser = conv.members.find(
                (m) => m.user.id !== user?.id,
              );
              const isOnline = otherUser
                ? onlineUsers.has(otherUser.user.id)
                : false;
              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConv(conv.id)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    textAlign: "left",
                    border: "none",
                    borderBottom: "0.5px solid #F0F0EE",
                    background: isActive ? "#F0FCF6" : "#fff",
                    borderLeft: isActive
                      ? "3px solid #1D9E75"
                      : "3px solid transparent",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: "#E1F5EE",
                          color: "#085041",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 500,
                        }}
                      >
                        {getConvAvatar(conv)}
                      </div>
                      {conv.type === "private" && isOnline && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: "#1D9E75",
                            border: "2px solid #fff",
                          }}
                        />
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          margin: 0,
                          color: isActive ? "#085041" : "#222",
                        }}
                      >
                        {getConvName(conv)}
                      </p>
                      {conv.messages[0] && (
                        <p
                          style={{
                            fontSize: 12,
                            color: "#aaa",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {conv.messages[0].content}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Zone messages ───────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {!activeConvId ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#aaa",
              fontSize: 14,
            }}
          >
            Sélectionne une conversation
          </div>
        ) : (
          <>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {loadingMsgs ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "#aaa",
                    fontSize: 13,
                    paddingTop: 20,
                  }}
                >
                  Chargement des messages...
                </div>
              ) : activeMessages.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "#aaa",
                    fontSize: 13,
                    paddingTop: 20,
                  }}
                >
                  Aucun message — commence la conversation !
                </div>
              ) : (
                activeMessages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        justifyContent: isMe ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "65%",
                          padding: "8px 12px",
                          borderRadius: isMe
                            ? "16px 16px 4px 16px"
                            : "16px 16px 16px 4px",
                          background: isMe ? "#1D9E75" : "#fff",
                          color: isMe ? "#fff" : "#222",
                          fontSize: 13,
                          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                          wordBreak: "break-word",
                        }}
                      >
                        {msg.content}
                        <div
                          style={{
                            fontSize: 10,
                            marginTop: 4,
                            opacity: 0.6,
                            textAlign: "right",
                          }}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Indicateur "en train d'écrire" */}
              {typingInConv.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      padding: "8px 12px",
                      background: "#fff",
                      borderRadius: "16px 16px 16px 4px",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#aaa",
                          animation: "bounce 1.2s infinite",
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Zone de saisie */}
            <div
              style={{
                padding: "12px 16px",
                borderTop: "0.5px solid #EAEAE8",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <input
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Écris un message…"
                style={{
                  flex: 1,
                  border: "0.5px solid #EAEAE8",
                  borderRadius: 20,
                  padding: "8px 14px",
                  fontSize: 13,
                  outline: "none",
                  background: "#F9F9F7",
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                style={{
                  background: input.trim() ? "#1D9E75" : "#E0E0DE",
                  color: "#fff",
                  border: "none",
                  borderRadius: 20,
                  padding: "8px 16px",
                  fontSize: 13,
                  cursor: input.trim() ? "pointer" : "default",
                  transition: "background 0.2s",
                  flexShrink: 0,
                }}
              >
                Envoyer
              </button>
            </div>
          </>
        )}
      </div>

      {/* Animation des points */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};
