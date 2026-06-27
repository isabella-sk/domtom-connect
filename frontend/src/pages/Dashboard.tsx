import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Navbar } from "../components/layout/Navbar";
import { Sidebar } from "../components/layout/Sidebar";
import { Footer } from "../components/layout/Footer";
import {
  FileText,
  MessageCircle,
  AlertTriangle,
  Users,
  ArrowRight,
} from "lucide-react";
import { useMobile } from "../hooks/useMobile";
import api from "../services/api";
import friseSide from "../assets/frise_side.png";

interface RecentPost {
  id: string;
  title: string;
  category: string;
  createdAt: string;
}
interface RecentTip {
  id: string;
  title: string;
  author: { username: string; originTerritory: string };
  createdAt: string;
}
interface RecentScam {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}
interface DashStats {
  unreadMessages: number;
  newGuides: number;
  recentAlerts: number;
  sameTerritory: number;
}

const MODULE_LOAD_TIME = new Date().getTime();

function timeAgo(date: string): string {
  const diff = MODULE_LOAD_TIME - new Date(date).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1) return "il y a moins d'1h";
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${d} jour${d > 1 ? "s" : ""}`;
}

const SEVEN_DAYS_MS = 7 * 24 * 3600 * 1000;

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobile();

  const [stats, setStats] = useState<DashStats>({
    unreadMessages: 0,
    newGuides: 0,
    recentAlerts: 0,
    sameTerritory: 0,
  });
  const [guides, setGuides] = useState<RecentPost[]>([]);
  const [tips, setTips] = useState<RecentTip[]>([]);
  const [scams, setScams] = useState<RecentScam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    Promise.all([
      // Messages non lus — conversations de l'utilisateur
      api.get("/chat/conversations").catch(() => ({ data: [] })),
      // Tous les guides (on filtre côté client sur 7j)
      api.get("/posts").catch(() => ({ data: [] })),
      // Tips approuvés récents
      api.get("/tips?isApproved=true").catch(() => ({ data: [] })),
      // Scams vérifiés récents
      api.get("/scam").catch(() => ({ data: [] })),
      // Utilisateurs du même territoire
      api
        .get(
          `/users?originTerritory=${encodeURIComponent(user.originTerritory)}`,
        )
        .catch(() => ({ data: [] })),
    ]).then(([convsRes, allPostsRes, allTipsRes, allScamsRes, sameTerrRes]) => {
      if (cancelled) return;

      const now = MODULE_LOAD_TIME;

      // ─ Messages non lus ──────────────────────────────────────────────────
      const convs = Array.isArray(convsRes.data) ? convsRes.data : [];
      const unreadMessages = convs.reduce(
        (
          acc: number,
          conv: { messages?: { readAt?: string | null; senderId?: string }[] },
        ) => {
          const unread = (conv.messages ?? []).filter(
            (m) => !m.readAt && m.senderId !== user.id,
          ).length;
          return acc + unread;
        },
        0,
      );

      // ─ Nouveaux guides (7 derniers jours) ────────────────────────────────
      const allPosts: RecentPost[] = Array.isArray(allPostsRes.data)
        ? allPostsRes.data
        : [];
      const newGuides = allPosts.filter(
        (p) => now - new Date(p.createdAt).getTime() < SEVEN_DAYS_MS,
      ).length;

      // ─ Alertes arnaques récentes (7j) ────────────────────────────────────
      const allScams: RecentScam[] = Array.isArray(allScamsRes.data)
        ? allScamsRes.data
        : [];
      const recentAlerts = allScams.filter(
        (s) => now - new Date(s.createdAt).getTime() < SEVEN_DAYS_MS,
      ).length;

      // ─ Étudiants du même territoire (hors soi-même) ──────────────────────
      const sameTerrUsers = Array.isArray(sameTerrRes.data)
        ? sameTerrRes.data
        : [];
      const sameTerritory = Math.max(
        0,
        sameTerrUsers.filter((u: { id: string }) => u.id !== user.id).length,
      );

      setStats({ unreadMessages, newGuides, recentAlerts, sameTerritory });

      // ─ Contenu récent pour les listes ────────────────────────────────────
      setGuides(allPosts.slice(0, 3));
      setTips(
        Array.isArray(allTipsRes.data) ? allTipsRes.data.slice(0, 3) : [],
      );
      setScams(allScams.slice(0, 2));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const STATS_CONFIG = [
    {
      label: "Messages non lus",
      value: stats.unreadMessages,
      icon: MessageCircle,
    },
    { label: "Nouveaux guides (7j)", value: stats.newGuides, icon: FileText },
    {
      label: "Alertes récentes (7j)",
      value: stats.recentAlerts,
      icon: AlertTriangle,
    },
    {
      label: user?.originTerritory
        ? `Étudiants ${user.originTerritory}`
        : "Étudiants du territoire",
      value: stats.sameTerritory,
      icon: Users,
    },
  ];

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
            width: isMobile ? "80%" : "55%",
            objectFit: "contain",
            opacity: 0.3,
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
            <div style={{ maxWidth: 1000 }}>
              {/* En-tête */}
              <div style={{ marginBottom: 32 }}>
                <p
                  style={{
                    color: "rgba(255,255,255,0.75)",
                    fontSize: 14,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 8,
                  }}
                >
                  Tableau de bord
                </p>
                <h1
                  style={{
                    color: "#fff",
                    fontSize: isMobile ? 28 : "clamp(28px, 4vw, 40px)",
                    fontWeight: 800,
                    margin: 0,
                    letterSpacing: "-1px",
                  }}
                >
                  Bienvenue, {user?.username} 👋
                </h1>
              </div>

              {/* Stats */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile
                    ? "repeat(2, 1fr)"
                    : "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: isMobile ? 10 : 16,
                  marginBottom: 40,
                }}
              >
                {STATS_CONFIG.map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 14,
                      padding: isMobile ? "12px 14px" : "16px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                      aria-hidden="true"
                    >
                      <stat.icon size={18} color="#fff" />
                    </div>
                    <div>
                      <p
                        style={{
                          color: "#fff",
                          fontSize: 22,
                          fontWeight: 700,
                          margin: 0,
                          lineHeight: 1,
                        }}
                      >
                        {loading ? "-" : stat.value}
                      </p>
                      <p
                        style={{
                          color: "rgba(255,255,255,0.7)",
                          fontSize: 11,
                          margin: "4px 0 0",
                        }}
                      >
                        {stat.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Derniers guides */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <h2 style={sectionTitleStyle}>Derniers guides</h2>
                <button
                  onClick={() => navigate("/guides")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  Voir tout <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>

              {loading ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                    gap: 16,
                    marginBottom: 40,
                  }}
                >
                  {([1, 2, 3] as const).map((i) => (
                    <div
                      key={i}
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: 14,
                        height: 110,
                      }}
                    />
                  ))}
                </div>
              ) : guides.length === 0 ? (
                <p
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 14,
                    marginBottom: 40,
                  }}
                >
                  Aucun guide disponible.
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                    gap: 16,
                    marginBottom: 40,
                  }}
                >
                  {guides.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => navigate(`/guides/${g.id}`)}
                      style={{
                        background: "#fff",
                        borderRadius: 14,
                        padding: "18px",
                        textAlign: "left",
                        border: "none",
                        cursor: "pointer",
                        transition: "transform 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.transform =
                          "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.transform =
                          "translateY(0)";
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          background: "#E6F1FB",
                          color: "#2888C5",
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: 50,
                          marginBottom: 10,
                          textTransform: "capitalize",
                        }}
                      >
                        {g.category}
                      </span>
                      <p
                        style={{
                          color: "#0a1d52",
                          fontSize: 14,
                          fontWeight: 600,
                          margin: "0 0 6px",
                          lineHeight: 1.4,
                        }}
                      >
                        {g.title}
                      </p>
                      <p style={{ color: "#aaa", fontSize: 11, margin: 0 }}>
                        {timeAgo(g.createdAt)}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* Tips récents */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <h2 style={sectionTitleStyle}>
                  Tips &amp; témoignages récents
                </h2>
                <button
                  onClick={() => navigate("/tips")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  Voir tout <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>

              <div style={listContainerStyle}>
                {loading ? (
                  <p
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontSize: 13,
                      padding: "14px 20px",
                    }}
                  >
                    Chargement...
                  </p>
                ) : tips.length === 0 ? (
                  <p
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontSize: 13,
                      padding: "14px 20px",
                    }}
                  >
                    Aucun tip disponible.
                  </p>
                ) : (
                  tips.map((tip, i) => (
                    <button
                      key={tip.id}
                      onClick={() => navigate(`/tips/${tip.id}`)}
                      style={{
                        width: "100%",
                        padding: "14px 20px",
                        borderTop: "none",
                        borderLeft: "none",
                        borderRight: "none",
                        borderBottom:
                          i < tips.length - 1
                            ? "1px solid rgba(255,255,255,0.1)"
                            : "none",
                        textAlign: "left",
                        background: "transparent",
                        cursor: "pointer",
                        display: "block",
                      }}
                    >
                      <p
                        style={{
                          color: "#fff",
                          fontSize: 14,
                          margin: 0,
                          fontWeight: 500,
                        }}
                      >
                        {tip.title}
                      </p>
                      <p style={listMetaStyle}>
                        {tip.author.username}, {tip.author.originTerritory}{" "}
                        &middot; {timeAgo(tip.createdAt)}
                      </p>
                    </button>
                  ))
                )}
              </div>

              {/* Alertes arnaques */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 40,
                  marginBottom: 16,
                }}
              >
                <h2 style={sectionTitleStyle}>Alertes arnaques récentes</h2>
                <button
                  onClick={() => navigate("/scams")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  Voir tout <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>

              <div style={listContainerStyle}>
                {loading ? (
                  <p
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontSize: 13,
                      padding: "14px 20px",
                    }}
                  >
                    Chargement...
                  </p>
                ) : scams.length === 0 ? (
                  <p
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontSize: 13,
                      padding: "14px 20px",
                    }}
                  >
                    Aucune alerte récente.
                  </p>
                ) : (
                  scams.map((scam, i) => (
                    <button
                      key={scam.id}
                      onClick={() => navigate(`/scams/${scam.id}`)}
                      style={{
                        width: "100%",
                        padding: "14px 20px",
                        borderTop: "none",
                        borderLeft: "none",
                        borderRight: "none",
                        borderBottom:
                          i < scams.length - 1
                            ? "1px solid rgba(255,255,255,0.1)"
                            : "none",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        textAlign: "left",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          flexShrink: 0,
                          marginTop: 5,
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#EF4444",
                          display: "block",
                        }}
                      />
                      <div>
                        <p
                          style={{
                            color: "#fff",
                            fontSize: 14,
                            margin: 0,
                            fontWeight: 500,
                          }}
                        >
                          {scam.title}
                        </p>
                        <p
                          style={{
                            color: "rgba(255,255,255,0.7)",
                            fontSize: 12,
                            margin: "4px 0 0",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {scam.description}
                        </p>
                        <p style={listMetaStyle}>{timeAgo(scam.createdAt)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const sectionTitleStyle: React.CSSProperties = {
  color: "#fff",
  fontSize: 18,
  fontWeight: 600,
  margin: 0,
};
const listContainerStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 16,
  padding: "8px 0",
  marginBottom: 24,
};
const listMetaStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.55)",
  fontSize: 12,
  margin: "4px 0 0",
};
