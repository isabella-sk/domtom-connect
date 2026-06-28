import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileText,
  Lightbulb,
  AlertTriangle,
  Pencil,
  Trash2,
  X,
  Pin,
} from "lucide-react";
import api from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { Navbar } from "../components/layout/Navbar";
import { Sidebar } from "../components/layout/Sidebar";
import { Footer } from "../components/layout/Footer";
import { useMobile } from "../hooks/useMobile";
import friseSide from "../assets/frise_side.png";
import { getApiErrorMessage } from "../utils/apiError";
import { EditArticlePanel } from "../components/layout/EditArticlePanel";

interface UserProfile {
  id: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  originTerritory: string;
  currentCity?: string;
  isFollowing: boolean;
  _count: { followers: number; following: number; posts: number };
}
interface FollowUser {
  id: string;
  username: string;
  avatarUrl?: string;
  originTerritory: string;
}
interface UserPost {
  id: string;
  title: string;
  content?: string;
  description?: string;
  category?: string;
  isPinned?: boolean;
  createdAt: string;
  type: "guide" | "tip" | "scam";
  tipType?: string;
  isApproved?: boolean;
  status?: string;
  authorId?: string;
  reporterId?: string;
  attachments?: {
    id: string;
    type: "image" | "document" | "link";
    url: string;
    name?: string;
  }[];
}
interface RawPost {
  id: string;
  title: string;
  content: string;
  category?: string;
  isPinned?: boolean;
  createdAt: string;
  authorId?: string;
  author?: { id: string };
}
interface RawTip {
  id: string;
  title: string;
  content: string;
  type?: string;
  isApproved?: boolean;
  createdAt: string;
  authorId?: string;
  author?: { id: string };
}
interface RawScam {
  id: string;
  title: string;
  description: string;
  category?: string;
  status?: string;
  createdAt: string;
  reporterId?: string;
  reporter?: { id: string };
}

const TYPE_CONFIG = {
  guide: {
    label: "Guide démarche",
    bg: "#E6F1FB",
    color: "#0C447C",
    icon: FileText,
  },
  tip: {
    label: "Tip & Témoignage",
    bg: "#FAEEDA",
    color: "#633806",
    icon: Lightbulb,
  },
  scam: {
    label: "Alerte arnaque",
    bg: "#FEE2E2",
    color: "#991B1B",
    icon: AlertTriangle,
  },
};

/** Retire la syntaxe Markdown pour un aperçu texte propre */
const stripMarkdown = (md: string, maxLength = 160): string => {
  const plain = md
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/\n+/g, " ")
    .trim();
  return plain.length > maxLength
    ? plain.slice(0, maxLength).trimEnd() + "…"
    : plain;
};

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div className="font-sans min-h-screen flex flex-col">
    <div
      style={{
        flex: 1,
        background:
          "radial-gradient(ellipse 140% 120% at 50% 35%, #3ab5e6 0%, #14539E 40%, #0a1d52 80%)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar />
      <div style={{ flex: 1, display: "flex" }}>
        <Sidebar />
        <main
          id="main-content"
          tabIndex={-1}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  </div>
);

export const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const isMobile = useMobile();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [tab, setTab] = useState<"posts" | "followers" | "following">("posts");
  const [list, setList] = useState<FollowUser[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [editingPost, setEditingPost] = useState<UserPost | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isOwn = id === currentUser?.id;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api
      .get(`/users/${id}?t=${Date.now()}`)
      .then((r) => {
        if (!cancelled) {
          setProfile(r.data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id || tab === "posts") return;
    let cancelled = false;
    const id1 = setTimeout(() => {
      if (!cancelled) setListLoading(true);
    }, 0);
    api
      .get(`/users/${id}/${tab}?t=${Date.now()}`)
      .then((r) => {
        if (!cancelled) setList(r.data);
      })
      .catch(() => {
        if (!cancelled) setList([]);
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
      clearTimeout(id1);
    };
  }, [id, tab]);

  useEffect(() => {
    if (!id || tab !== "posts") return;
    let cancelled = false;
    const postsLoadId = setTimeout(() => {
      if (!cancelled) setPostsLoading(true);
    }, 0);
    Promise.all([
      api
        .get<RawPost[]>(`/posts?authorId=${id}`)
        .catch(() => ({ data: [] as RawPost[] })),
      api
        .get<RawTip[]>(`/tips?authorId=${id}`)
        .catch(() => ({ data: [] as RawTip[] })),
      isOwn
        ? api
            .get<RawScam[]>(`/scam?reporterId=${id}`)
            .catch(() => ({ data: [] as RawScam[] }))
        : Promise.resolve({ data: [] as RawScam[] }),
    ]).then(([postsRes, tipsRes, scamsRes]) => {
      if (cancelled) return;
      const posts: UserPost[] = [
        ...postsRes.data
          .filter((p) => p.authorId === id || p.author?.id === id)
          .map((p): UserPost => ({ ...p, type: "guide" })),
        ...tipsRes.data
          .filter((t) => t.authorId === id || t.author?.id === id)
          .map(
            (t): UserPost => ({
              ...t,
              type: "tip",
              tipType: t.type,
              content: t.content,
              attachments:
                (t as { attachments?: UserPost["attachments"] }).attachments ??
                [],
            }),
          ),
        ...scamsRes.data
          .filter((s) => s.reporterId === id || s.reporter?.id === id)
          .map(
            (s): UserPost => ({
              ...s,
              type: "scam",
              content: s.description,
              attachments:
                (s as { attachments?: UserPost["attachments"] }).attachments ??
                [],
            }),
          ),
      ].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setUserPosts(posts);
      setPostsLoading(false);
      clearTimeout(postsLoadId);
    });
    return () => {
      cancelled = true;
    };
  }, [id, tab, isOwn]);

  const handleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      if (profile.isFollowing) await api.delete(`/users/${profile.id}/follow`);
      else await api.post(`/users/${profile.id}/follow`);
      const r = await api.get(`/users/${profile.id}?t=${Date.now()}`);
      setProfile(r.data);
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setFollowLoading(false);
    }
  };

  const startConversation = async () => {
    if (!profile) return;
    try {
      await api.post("/chat/conversations/private", {
        targetUserId: profile.id,
      });
      navigate("/chat");
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  };

  const handleDelete = async (post: UserPost) => {
    if (!isOwn || !window.confirm("Supprimer cette publication ?")) return;
    setDeletingId(post.id);
    try {
      if (post.type === "guide") await api.delete(`/posts/${post.id}`);
      else if (post.type === "tip") await api.delete(`/tips/${post.id}`);
      else await api.delete(`/scam/${post.id}`);
      setUserPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading)
    return (
      <PageShell>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
          Chargement...
        </p>
      </PageShell>
    );
  if (!profile)
    return (
      <PageShell>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
          Profil introuvable.
        </p>
      </PageShell>
    );

  const TABS = [
    { key: "posts", label: isOwn ? "Mes publications" : "Publications" },
    { key: "followers", label: `Abonnés (${profile._count.followers})` },
    { key: "following", label: `Abonnements (${profile._count.following})` },
  ] as const;

  return (
    <div className="font-sans min-h-screen flex flex-col">
      <div
        style={{
          flex: 1,
          background:
            "radial-gradient(ellipse 140% 120% at 50% 35%, #3ab5e6 0%, #14539E 40%, #0a1d52 80%)",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
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
          }}
        />
        <Navbar />
        <div
          style={{ flex: 1, display: "flex", position: "relative", zIndex: 1 }}
        >
          <Sidebar />
          <main
            id="main-content"
            tabIndex={-1}
            style={{
              flex: 1,
              padding: isMobile ? "20px 16px 60px" : "32px 48px 80px",
              minWidth: 0,
            }}
          >
            <div style={{ maxWidth: "100%", margin: "0 auto" }}>
              {actionError && (
                <div
                  role="alert"
                  style={{
                    background: "rgba(220,38,38,0.12)",
                    border: "1px solid rgba(220,38,38,0.4)",
                    borderRadius: 10,
                    padding: "10px 16px",
                    fontSize: 13,
                    color: "#DC2626",
                    marginBottom: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span>✗ {actionError}</span>
                  <button
                    onClick={() => setActionError(null)}
                    aria-label="Fermer l'erreur"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#DC2626",
                    }}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              )}

              {/* Carte profil */}
              <section
                aria-label="Informations du profil"
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: isMobile ? "20px 18px" : "28px 32px",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: isMobile ? 14 : 20,
                    alignItems: "flex-start",
                    flexWrap: isMobile ? "wrap" : "nowrap",
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #3ab5e6, #14539E)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 26,
                      fontWeight: 800,
                      flexShrink: 0,
                      overflow: "hidden",
                      border: "3px solid #fff",
                      boxShadow: "0 4px 14px rgba(20,83,158,0.2)",
                    }}
                    aria-hidden="true"
                  >
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      profile.username[0].toUpperCase()
                    )}
                  </div>

                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        flexWrap: "wrap",
                        marginBottom: 12,
                      }}
                    >
                      <h1
                        style={{
                          fontSize: isMobile ? 18 : 20,
                          fontWeight: 800,
                          margin: 0,
                          color: "#0a1d52",
                        }}
                      >
                        {profile.username}
                      </h1>
                      {!isOwn && (
                        <button
                          onClick={handleFollow}
                          disabled={followLoading}
                          aria-label={
                            profile.isFollowing ? "Se désabonner" : "Suivre"
                          }
                          style={{
                            padding: "6px 18px",
                            fontSize: 12,
                            fontWeight: 600,
                            border: profile.isFollowing
                              ? "1.5px solid #ddd"
                              : "none",
                            background: profile.isFollowing
                              ? "#fff"
                              : "#1D9E75",
                            color: profile.isFollowing ? "#444" : "#fff",
                            borderRadius: 50,
                            cursor: "pointer",
                            opacity: followLoading ? 0.6 : 1,
                            minHeight: 36,
                          }}
                        >
                          {followLoading
                            ? "..."
                            : profile.isFollowing
                              ? "Abonné(e)"
                              : "Suivre"}
                        </button>
                      )}
                      {isOwn && (
                        <button
                          onClick={() => navigate("/settings")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 14px",
                            fontSize: 12,
                            border: "1.5px solid #e5e7eb",
                            background: "#fff",
                            borderRadius: 50,
                            cursor: "pointer",
                            color: "#555",
                            fontWeight: 500,
                            minHeight: 36,
                          }}
                        >
                          <Pencil size={13} color="#555" aria-hidden="true" />
                          Modifier
                        </button>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: isMobile ? 16 : 24,
                        marginBottom: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      {[
                        { val: profile._count.posts, label: "publications" },
                        { val: profile._count.followers, label: "abonnés" },
                        { val: profile._count.following, label: "abonnements" },
                      ].map(({ val, label }) => (
                        <div key={label} style={{ textAlign: "center" }}>
                          <p
                            style={{
                              fontSize: 18,
                              fontWeight: 800,
                              margin: 0,
                              color: "#0a1d52",
                            }}
                          >
                            {val}
                          </p>
                          <p style={{ fontSize: 11, color: "#aaa", margin: 0 }}>
                            {label}
                          </p>
                        </div>
                      ))}
                    </div>

                    <p
                      style={{ fontSize: 13, color: "#555", margin: "0 0 2px" }}
                    >
                      🌏 {profile.originTerritory}
                    </p>
                    {profile.currentCity && (
                      <p
                        style={{
                          fontSize: 13,
                          color: "#888",
                          margin: "0 0 4px",
                        }}
                      >
                        📍 {profile.currentCity}
                      </p>
                    )}
                    {profile.bio && (
                      <p
                        style={{
                          fontSize: 13,
                          color: "#444",
                          lineHeight: 1.6,
                          marginTop: 8,
                        }}
                      >
                        {profile.bio}
                      </p>
                    )}
                  </div>
                </div>

                {!isOwn && (
                  <div
                    style={{
                      marginTop: 18,
                      paddingTop: 18,
                      borderTop: "1px solid #f3f4f6",
                    }}
                  >
                    <button
                      onClick={startConversation}
                      style={{
                        padding: "10px 20px",
                        background: "#0a1d52",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 13,
                        cursor: "pointer",
                        fontWeight: 600,
                        minHeight: 44,
                      }}
                    >
                      💬 Envoyer un message
                    </button>
                  </div>
                )}
              </section>

              {/* Onglets */}
              <div
                role="tablist"
                aria-label="Sections du profil"
                style={{
                  display: "flex",
                  gap: 4,
                  marginBottom: 20,
                  flexWrap: "wrap",
                }}
              >
                {TABS.map(({ key, label }) => {
                  const active = tab === key;
                  return (
                    <button
                      key={key}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setTab(key)}
                      style={{
                        padding: "8px 18px",
                        borderRadius: 50,
                        fontSize: 13,
                        border: active
                          ? "1.5px solid #fff"
                          : "1.5px solid rgba(255,255,255,0.25)",
                        background: active ? "#fff" : "transparent",
                        color: active ? "#0a1d52" : "rgba(255,255,255,0.8)",
                        fontWeight: active ? 600 : 400,
                        cursor: "pointer",
                        minHeight: 36,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {editingPost && (
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 18,
                    padding: 28,
                    marginBottom: 24,
                    boxShadow: "0 12px 30px rgba(0,0,0,.08)",
                  }}
                >
                  <EditArticlePanel
                    article={{
                      id: editingPost.id,
                      title: editingPost.title,
                      content:
                        editingPost.content ?? editingPost.description ?? "",
                      articleType: editingPost.type,
                      category: editingPost.category,
                      attachments: editingPost.attachments ?? [],
                    }}
                    role="user"
                    onSaved={(updated) => {
                      setUserPosts((prev) =>
                        prev.map((p) =>
                          p.id === updated.id
                            ? {
                                ...p,
                                title: updated.title,
                                content: updated.content,
                                description: updated.content,
                                category: updated.category ?? p.category,
                                attachments: updated.attachments,
                              }
                            : p,
                        ),
                      );

                      setEditingPost(null);
                    }}
                    onCancel={() => setEditingPost(null)}
                  />
                </div>
              )}
              {/* Publications */}
              {tab === "posts" && (
                <div>
                  {postsLoading ? (
                    <p
                      aria-live="polite"
                      style={{
                        textAlign: "center",
                        color: "rgba(255,255,255,0.6)",
                        padding: "40px 0",
                      }}
                    >
                      Chargement...
                    </p>
                  ) : userPosts.length === 0 ? (
                    <p
                      style={{
                        textAlign: "center",
                        color: "rgba(255,255,255,0.6)",
                        padding: "40px 0",
                        fontSize: 14,
                      }}
                    >
                      {isOwn
                        ? "Tu n'as pas encore publié de contenu."
                        : "Aucune publication pour l'instant."}
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile
                          ? "repeat(2, 1fr)"
                          : "repeat(5, 1fr)",
                        gap: 16,
                        alignItems: "stretch",
                      }}
                    >
                      {userPosts.map((post) => {
                        const config = TYPE_CONFIG[post.type];
                        const Icon = config.icon;
                        const isDeleting = deletingId === post.id;
                        return (
                          <article
                            key={post.id}
                            style={{
                              position: "relative",
                              background: "#fff",
                              borderRadius: 14,
                              padding: 16,
                              minHeight: 220,
                              display: "flex",
                              flexDirection: "column",
                              cursor: "pointer",
                            }}
                          >
                            {/* MAIN */}
                            <div
                              style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                minWidth: 0,
                              }}
                            >
                              {/* TITLE */}
                              <h2
                                style={{
                                  width: 200,
                                  fontSize: 15,
                                  fontWeight: 700,
                                  margin: 0,
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {post.title}
                              </h2>

                              {/* CONTENT */}
                              <p
                                style={{
                                  fontSize: 13,
                                  color: "#777",
                                  marginTop: 8,
                                  marginBottom: 0,
                                  display: "-webkit-box",
                                  WebkitLineClamp: 4,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {stripMarkdown(
                                  post.content ?? post.description ?? "",
                                )}
                              </p>

                              {/* PUSH FOOTER DOWN */}
                              <div style={{ marginTop: "auto" }}>
                                {/* TAGS */}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    flexWrap: "wrap",
                                    margin: 0,
                                  }}
                                >
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      fontSize: 11,
                                      fontWeight: 600,
                                      background: config.bg,
                                      color: config.color,
                                      padding: "3px 10px",
                                      borderRadius: 50,
                                    }}
                                  >
                                    <Icon size={11} aria-hidden="true" />{" "}
                                    {config.label}
                                  </span>

                                  {post.category && (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: "#9CA3AF",
                                        background: "#F3F4F6",
                                        padding: "3px 10px",
                                        borderRadius: 50,
                                        textTransform: "capitalize",
                                      }}
                                    >
                                      {post.category}
                                    </span>
                                  )}

                                  {post.isPinned && (
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 3,
                                        fontSize: 11,
                                        color: "#2888C5",
                                        background: "#E6F1FB",
                                        padding: "3px 10px",
                                        borderRadius: 50,
                                      }}
                                    >
                                      <Pin size={10} aria-hidden="true" />{" "}
                                      Épinglé
                                    </span>
                                  )}
                                </div>
                                {/* DATE */}
                                <p
                                  style={{
                                    fontSize: 11,
                                    color: "#bbb",
                                    margin: "5px 0 0 0",
                                  }}
                                >
                                  <time dateTime={post.createdAt}>
                                    {new Date(
                                      post.createdAt,
                                    ).toLocaleDateString("fr-FR", {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    })}
                                  </time>
                                </p>
                              </div>
                            </div>

                            {/* ACTIONS */}
                            {isOwn && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingPost(post);
                                    window.scrollTo({
                                      top: 0,
                                      behavior: "smooth",
                                    });
                                  }}
                                  aria-label={`Modifier : ${post.title}`}
                                  style={{
                                    position: "absolute",
                                    top: 12,
                                    right: 45,
                                    width: 30,
                                    height: 30,
                                    borderRadius: 6,
                                    border: "1.5px solid #e5e7eb",
                                    background: "#fff",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Pencil
                                    size={13}
                                    color="#555"
                                    aria-hidden="true"
                                  />
                                </button>

                                <button
                                  onClick={() => handleDelete(post)}
                                  disabled={isDeleting}
                                  aria-label={`Supprimer : ${post.title}`}
                                  style={{
                                    position: "absolute",
                                    top: 12,
                                    right: 12,
                                    width: 30,
                                    height: 30,
                                    borderRadius: 6,
                                    border: "1.5px solid #FEE2E2",
                                    background: "#FFF5F5",
                                    cursor: "pointer",
                                    opacity: isDeleting ? 0.5 : 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Trash2
                                    size={13}
                                    color="#DC2626"
                                    aria-hidden="true"
                                  />
                                </button>
                              </>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Followers / Following */}
              {(tab === "followers" || tab === "following") && (
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 14,
                    overflow: "hidden",
                  }}
                >
                  {listLoading ? (
                    <p
                      style={{
                        textAlign: "center",
                        padding: 24,
                        color: "#aaa",
                        fontSize: 13,
                      }}
                    >
                      Chargement...
                    </p>
                  ) : list.length === 0 ? (
                    <p
                      style={{
                        textAlign: "center",
                        padding: 24,
                        color: "#aaa",
                        fontSize: 13,
                      }}
                    >
                      {tab === "followers"
                        ? "Aucun abonné pour l'instant"
                        : "Ne suit personne pour l'instant"}
                    </p>
                  ) : (
                    list.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => navigate(`/profile/${u.id}`)}
                        style={{
                          width: "100%",
                          padding: "12px 18px",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          border: "none",
                          borderBottom: "1px solid #f5f5f3",
                          background: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          minHeight: 60,
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, #3ab5e6, #14539E)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 15,
                            fontWeight: 700,
                            flexShrink: 0,
                            overflow: "hidden",
                          }}
                          aria-hidden="true"
                        >
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt=""
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            u.username[0].toUpperCase()
                          )}
                        </div>
                        <div>
                          <p
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              margin: 0,
                              color: "#0a1d52",
                            }}
                          >
                            {u.username}
                          </p>
                          <p style={{ fontSize: 11, color: "#888", margin: 0 }}>
                            {u.originTerritory}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
};
