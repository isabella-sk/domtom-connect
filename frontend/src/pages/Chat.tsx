import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, Trash2, ArrowLeft } from "lucide-react";
import api from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { useChatStore, type Conversation } from "../stores/chatStore";
import { useSocket } from "../hooks/userSocket";
import { Navbar } from "../components/layout/Navbar";
import { Sidebar } from "../components/layout/Sidebar";
import { useMobile } from "../hooks/useMobile";
import friseSide from "../assets/frise_side.png";

export const Chat = () => {
  const { user } = useAuthStore();
  const isMobile = useMobile();
  const {
    conversations,
    setConversations,
    activeConvId,
    setActiveConv,
    messages,
    setMessages,
    updateMessage,
    clearMessages,
    typingUsers,
    onlineUsers,
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
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  // Sur mobile : affiche soit la liste soit la conv
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .get("/chat/conversations")
      .then((r) => setConversations(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [setConversations]);

  useEffect(() => {
    if (!activeConvId) return;
    let cancelled = false;
    const id = setTimeout(() => {
      if (!cancelled) setLoadingMsgs(true);
    }, 0);
    api
      .get(`/chat/conversations/${activeConvId}/messages`)
      .then((r) => {
        if (!cancelled) setMessages(activeConvId, r.data.reverse());
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoadingMsgs(false);
      });
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [activeConvId, setMessages]);

  useEffect(() => {
    if (activeConvId) markRead(activeConvId);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeConvId, markRead]);

  const handleSelectConv = (convId: string) => {
    setActiveConv(convId);
    joinConversation(convId);
    if (isMobile) setMobileView("chat");
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

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeConvId) return;
    try {
      await api.delete(
        `/chat/conversations/${activeConvId}/messages/${messageId}`,
      );
      updateMessage(activeConvId, messageId, {
        content: "__deleted__",
        deletedForIds: ["__everyone__"],
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConversation = async (conv: Conversation) => {
    if (!window.confirm("Supprimer cette conversation ?")) return;
    try {
      await api.delete(`/chat/conversations/${conv.id}`);
      clearMessages(conv.id);
      setConversations(conversations.filter((c) => c.id !== conv.id));
      if (activeConvId === conv.id) {
        setActiveConv(null);
        if (isMobile) setMobileView("list");
      }
    } catch (err) {
      console.error(err);
    }
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

  const getConvAvatarUrl = (conv: Conversation) => {
    if (conv.type === "group") return null;
    const other = conv.members.find((m) => m.user.id !== user?.id);
    return other?.user.avatarUrl ?? null;
  };

  const activeMessages = activeConvId ? (messages[activeConvId] ?? []) : [];
  const typingInConv = activeConvId
    ? (typingUsers[activeConvId] ?? []).filter((id) => id !== user?.id)
    : [];
  const activeConv = conversations.find((c) => c.id === activeConvId);
  const otherUser = activeConv?.members.find((m) => m.user.id !== user?.id);
  const isOtherOnline = otherUser ? onlineUsers.has(otherUser.user.id) : false;

  // Sur mobile : si vue chat active, on masque la liste
  const showList = !isMobile || mobileView === "list";
  const showChat = !isMobile || mobileView === "chat";

  return (
    <div
      className="font-sans"
      style={{
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          flex: 1,
          background:
            "radial-gradient(ellipse 140% 120% at 50% 35%, #3ab5e6 0%, #14539E 40%, #0a1d52 80%)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        <img
          src={friseSide}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "30%",
            opacity: 0.2,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div style={{ flexShrink: 0, position: "relative", zIndex: 10 }}>
          <Navbar />
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            minHeight: 0,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <Sidebar />
          </div>

          <main
            id="main-content"
            tabIndex={-1}
            style={{
              flex: 1,
              display: "flex",
              gap: isMobile ? 0 : 16,
              padding: isMobile ? "12px 12px 12px" : "20px 32px 24px",
              minHeight: 0,
              minWidth: 0,
            }}
          >
            {/* Liste conversations */}
            {showList && (
              <div
                role="complementary"
                aria-label="Liste des conversations"
                style={{
                  width: isMobile ? "100%" : 280,
                  flexShrink: 0,
                  background: "rgba(255,255,255,0.06)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.12)",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  minHeight: 0,
                }}
              >
                <div
                  style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    flexShrink: 0,
                  }}
                >
                  <h1
                    style={{
                      color: "#fff",
                      fontSize: 14,
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    Messages
                  </h1>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.45)",
                      fontSize: 11,
                      margin: "2px 0 0",
                    }}
                  >
                    {conversations.length} conversation
                    {conversations.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                  {loading ? (
                    <p
                      aria-live="polite"
                      style={{
                        textAlign: "center",
                        color: "rgba(255,255,255,0.5)",
                        padding: 20,
                        fontSize: 13,
                      }}
                    >
                      Chargement...
                    </p>
                  ) : conversations.length === 0 ? (
                    <div style={{ padding: 20, textAlign: "center" }}>
                      <MessageCircle
                        size={28}
                        aria-hidden="true"
                        style={{
                          color: "rgba(255,255,255,0.2)",
                          marginBottom: 8,
                        }}
                      />
                      <p
                        style={{
                          color: "rgba(255,255,255,0.45)",
                          fontSize: 12,
                          margin: 0,
                        }}
                      >
                        Aucune conversation.
                      </p>
                    </div>
                  ) : (
                    conversations.map((conv) => {
                      const isActive = conv.id === activeConvId;
                      const otherMember = conv.members.find(
                        (m) => m.user.id !== user?.id,
                      );
                      const isOnline = otherMember
                        ? onlineUsers.has(otherMember.user.id)
                        : false;
                      const avatarUrl = getConvAvatarUrl(conv);
                      const lastMsg = conv.messages[0];

                      return (
                        <div
                          key={conv.id}
                          style={{ position: "relative" }}
                          onMouseEnter={(e) => {
                            const btn =
                              e.currentTarget.querySelector<HTMLButtonElement>(
                                ".del-conv",
                              );
                            if (btn) btn.style.opacity = "1";
                          }}
                          onMouseLeave={(e) => {
                            const btn =
                              e.currentTarget.querySelector<HTMLButtonElement>(
                                ".del-conv",
                              );
                            if (btn) btn.style.opacity = "0";
                          }}
                        >
                          <button
                            onClick={() => handleSelectConv(conv.id)}
                            aria-current={isActive ? "true" : undefined}
                            aria-label={`Conversation avec ${getConvName(conv)}`}
                            style={{
                              width: "100%",
                              padding: "11px 40px 11px 14px",
                              textAlign: "left",
                              border: "none",
                              borderBottom: "1px solid rgba(255,255,255,0.06)",
                              background: isActive
                                ? "rgba(255,255,255,0.13)"
                                : "transparent",
                              cursor: "pointer",
                              transition: "background 0.15s",
                              minHeight: 56,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                              }}
                            >
                              <div
                                style={{ position: "relative", flexShrink: 0 }}
                              >
                                <div
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "50%",
                                    background: isActive
                                      ? "rgba(255,255,255,0.25)"
                                      : "rgba(255,255,255,0.15)",
                                    color: "#fff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    overflow: "hidden",
                                  }}
                                  aria-hidden="true"
                                >
                                  {avatarUrl ? (
                                    <img
                                      src={avatarUrl}
                                      alt=""
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                      }}
                                    />
                                  ) : (
                                    getConvAvatar(conv)
                                  )}
                                </div>
                                {conv.type === "private" && isOnline && (
                                  <div
                                    aria-label="En ligne"
                                    style={{
                                      position: "absolute",
                                      bottom: 1,
                                      right: 1,
                                      width: 9,
                                      height: 9,
                                      borderRadius: "50%",
                                      background: "#4ADE80",
                                      border: "2px solid #14539E",
                                    }}
                                  />
                                )}
                              </div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <p
                                  style={{
                                    fontSize: 13,
                                    fontWeight: isActive ? 700 : 500,
                                    margin: 0,
                                    color: "#fff",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {getConvName(conv)}
                                </p>
                                {lastMsg && (
                                  <p
                                    style={{
                                      fontSize: 11,
                                      color: "rgba(255,255,255,0.45)",
                                      margin: "2px 0 0",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {lastMsg.content === "__deleted__"
                                      ? "Message supprimé"
                                      : lastMsg.content}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>

                          <button
                            className="del-conv"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConversation(conv);
                            }}
                            aria-label={`Supprimer la conversation avec ${getConvName(conv)}`}
                            style={{
                              position: "absolute",
                              right: 8,
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "rgba(220,38,38,0.2)",
                              border: "none",
                              borderRadius: 6,
                              width: 30,
                              height: 30,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              opacity: 0,
                              transition: "opacity 0.15s",
                            }}
                          >
                            <Trash2
                              size={13}
                              color="#FCA5A5"
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Zone messages */}
            {showChat && (
              <div
                aria-label="Zone de messages"
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.06)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.12)",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  minWidth: 0,
                  minHeight: 0,
                }}
              >
                {!activeConvId ? (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                    }}
                  >
                    <MessageCircle
                      size={44}
                      aria-hidden="true"
                      style={{ color: "rgba(255,255,255,0.12)" }}
                    />
                    <p
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        fontSize: 14,
                        margin: 0,
                      }}
                    >
                      Sélectionne une conversation
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Header conv */}
                    <div
                      style={{
                        padding: "12px 18px",
                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexShrink: 0,
                      }}
                    >
                      {/* Retour mobile */}
                      {isMobile && (
                        <button
                          onClick={() => setMobileView("list")}
                          aria-label="Retour à la liste des conversations"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "rgba(255,255,255,0.7)",
                            display: "flex",
                            padding: 4,
                            marginRight: 4,
                          }}
                        >
                          <ArrowLeft size={20} aria-hidden="true" />
                        </button>
                      )}
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.15)",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 700,
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                        aria-hidden="true"
                      >
                        {activeConv && getConvAvatarUrl(activeConv) ? (
                          <img
                            src={getConvAvatarUrl(activeConv)!}
                            alt=""
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          activeConv && getConvAvatar(activeConv)
                        )}
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#fff",
                            margin: 0,
                          }}
                        >
                          {activeConv && getConvName(activeConv)}
                        </p>
                        <p
                          style={{
                            fontSize: 11,
                            color: isOtherOnline
                              ? "#4ADE80"
                              : "rgba(255,255,255,0.35)",
                            margin: 0,
                          }}
                          aria-live="polite"
                        >
                          {isOtherOnline ? "● En ligne" : "● Hors ligne"}
                        </p>
                      </div>
                    </div>

                    {/* Messages */}
                    <div
                      role="log"
                      aria-label="Messages"
                      aria-live="polite"
                      style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "14px 18px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        minHeight: 0,
                      }}
                    >
                      {loadingMsgs ? (
                        <p
                          style={{
                            textAlign: "center",
                            color: "rgba(255,255,255,0.45)",
                            fontSize: 13,
                            paddingTop: 20,
                          }}
                        >
                          Chargement...
                        </p>
                      ) : activeMessages.length === 0 ? (
                        <p
                          style={{
                            textAlign: "center",
                            color: "rgba(255,255,255,0.35)",
                            fontSize: 13,
                            paddingTop: 20,
                          }}
                        >
                          Aucun message &mdash; commence la conversation !
                        </p>
                      ) : (
                        activeMessages.map((msg) => {
                          const isMe = msg.senderId === user?.id;
                          const isDeleted =
                            msg.deletedForIds?.includes("__everyone__") ||
                            msg.content === "__deleted__";

                          return (
                            <div
                              key={msg.id}
                              style={{
                                display: "flex",
                                justifyContent: isMe
                                  ? "flex-end"
                                  : "flex-start",
                              }}
                              onMouseEnter={() => setHoveredMsgId(msg.id)}
                              onMouseLeave={() => setHoveredMsgId(null)}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  flexDirection: isMe ? "row-reverse" : "row",
                                  maxWidth: isMobile ? "90%" : "70%",
                                }}
                              >
                                {isMe &&
                                  !isDeleted &&
                                  hoveredMsgId === msg.id && (
                                    <button
                                      onClick={() =>
                                        handleDeleteMessage(msg.id)
                                      }
                                      aria-label="Supprimer ce message pour tout le monde"
                                      style={{
                                        background: "rgba(220,38,38,0.15)",
                                        border: "none",
                                        borderRadius: 6,
                                        width: 28,
                                        height: 28,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        flexShrink: 0,
                                      }}
                                    >
                                      <Trash2
                                        size={12}
                                        color="#FCA5A5"
                                        aria-hidden="true"
                                      />
                                    </button>
                                  )}
                                <div
                                  style={{
                                    padding: "9px 13px",
                                    borderRadius: isMe
                                      ? "16px 16px 4px 16px"
                                      : "16px 16px 16px 4px",
                                    background: isDeleted
                                      ? "rgba(255,255,255,0.06)"
                                      : isMe
                                        ? "#1D9E75"
                                        : "rgba(255,255,255,0.12)",
                                    color: isDeleted
                                      ? "rgba(255,255,255,0.35)"
                                      : "#fff",
                                    fontSize: 13,
                                    fontStyle: isDeleted ? "italic" : "normal",
                                    lineHeight: 1.5,
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {isDeleted ? "Message supprimé" : msg.content}
                                  <div
                                    style={{
                                      fontSize: 10,
                                      marginTop: 3,
                                      opacity: 0.5,
                                      textAlign: "right",
                                    }}
                                  >
                                    <time dateTime={msg.createdAt}>
                                      {new Date(
                                        msg.createdAt,
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </time>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {typingInConv.length > 0 && (
                        <div
                          aria-live="polite"
                          aria-label="Quelqu'un est en train d'écrire"
                          style={{
                            display: "flex",
                            gap: 4,
                            padding: "9px 13px",
                            background: "rgba(255,255,255,0.1)",
                            borderRadius: "16px 16px 16px 4px",
                            width: "fit-content",
                          }}
                        >
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              aria-hidden="true"
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "rgba(255,255,255,0.6)",
                                animation: "bounce 1.2s infinite",
                                animationDelay: `${i * 0.2}s`,
                              }}
                            />
                          ))}
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div
                      style={{
                        padding: "12px 16px",
                        borderTop: "1px solid rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexShrink: 0,
                      }}
                    >
                      <label htmlFor="chat-input" style={{ display: "none" }}>
                        Écrire un message
                      </label>
                      <input
                        id="chat-input"
                        ref={inputRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Écris un message…"
                        autoComplete="off"
                        style={{
                          flex: 1,
                          background: "rgba(255,255,255,0.1)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: 50,
                          padding: "10px 16px",
                          fontSize: 13,
                          color: "#fff",
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        aria-label="Envoyer le message"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: input.trim()
                            ? "#1D9E75"
                            : "rgba(255,255,255,0.1)",
                          border: "none",
                          cursor: input.trim() ? "pointer" : "default",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "background 0.2s",
                        }}
                      >
                        <Send size={15} color="#fff" aria-hidden="true" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
