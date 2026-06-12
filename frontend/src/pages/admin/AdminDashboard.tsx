import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X, Lightbulb, BookOpen } from "lucide-react";
import api from "../../services/api";

interface Stats {
  users: number;
  posts: number;
  pendingTips: number;
  pendingScams: number;
}
interface ScamReport {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  createdAt: string;
  reporter: { username: string };
}
interface Tip {
  id: string;
  title: string;
  content: string;
  type: string;
  isApproved: boolean;
  author: { username: string; originTerritory: string };
}

type TabType = "overview" | "scams" | "tips";

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabType>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [scams, setScams] = useState<ScamReport[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/stats")
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (tab === "scams") {
      api
        .get("/admin/scam/pending")
        .then((r) => {
          if (!cancelled) setScams(r.data);
        })
        .catch(console.error);
    }
    if (tab === "tips") {
      api
        .get("/admin/tips/pending")
        .then((r) => {
          if (!cancelled) setTips(r.data);
        })
        .catch(console.error);
    }

    return () => {
      cancelled = true;
    };
  }, [tab]);

  const handleScam = async (id: string, status: "verified" | "rejected") => {
    await api.patch(`/admin/scam/${id}/status`, { status });
    setScams((s) => s.filter((r) => r.id !== id));
    setStats((s) => (s ? { ...s, pendingScams: s.pendingScams - 1 } : s));
  };

  const handleTip = async (id: string, isApproved: boolean) => {
    await api.patch(`/admin/tips/${id}/status`, { isApproved });
    setTips((t) => t.filter((r) => r.id !== id));
    setStats((s) => (s ? { ...s, pendingTips: s.pendingTips - 1 } : s));
  };

  const TABS = [
    { key: "overview", label: "Vue d'ensemble" },
    { key: "scams", label: `Arnaques (${stats?.pendingScams ?? "…"})` },
    { key: "tips", label: `Tips (${stats?.pendingTips ?? "…"})` },
  ] as const;

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "24px 16px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            fontSize: 12,
            color: "#888",
            border: "none",
            background: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <ArrowLeft size={12} /> Retour
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 500, flex: 1, margin: 0 }}>
          Dashboard Admin
        </h1>
        <span
          style={{
            padding: "3px 10px",
            background: "#FCEBEB",
            color: "#791F1F",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 500,
          }}
        >
          ADMIN
        </span>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "0.5px solid #EAEAE8",
          marginBottom: 24,
        }}
      >
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as TabType)}
            style={{
              padding: "10px 20px",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              background: "none",
              borderBottom:
                tab === key ? "2px solid #1D9E75" : "2px solid transparent",
              color: tab === key ? "#1D9E75" : "#666",
              fontWeight: tab === key ? 500 : 400,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div>
          {loading ? (
            <p style={{ color: "#aaa", fontSize: 13 }}>Chargement...</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2,1fr)",
                gap: 14,
              }}
            >
              {[
                {
                  label: "Utilisateurs inscrits",
                  val: stats?.users,
                  color: "#E6F1FB",
                  text: "#0C447C",
                },
                {
                  label: "Guides publiés",
                  val: stats?.posts,
                  color: "#E1F5EE",
                  text: "#085041",
                },
                {
                  label: "Arnaques en attente",
                  val: stats?.pendingScams,
                  color: "#FAEEDA",
                  text: "#633806",
                },
                {
                  label: "Tips en attente",
                  val: stats?.pendingTips,
                  color: "#FCEBEB",
                  text: "#791F1F",
                },
              ].map(({ label, val, color, text }) => (
                <div
                  key={label}
                  style={{
                    background: color,
                    borderRadius: 12,
                    padding: "20px 24px",
                  }}
                >
                  <p
                    style={{
                      fontSize: 32,
                      fontWeight: 700,
                      margin: 0,
                      color: text,
                    }}
                  >
                    {val ?? "—"}
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      margin: "4px 0 0",
                      color: text,
                      opacity: 0.8,
                    }}
                  >
                    {label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scam reports */}
      {tab === "scams" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {scams.length === 0 ? (
            <p
              style={{
                color: "#aaa",
                fontSize: 13,
                textAlign: "center",
                padding: 30,
              }}
            >
              Aucun signalement en attente
            </p>
          ) : (
            scams.map((r) => (
              <div
                key={r.id}
                style={{
                  background: "#fff",
                  border: "0.5px solid #EAEAE8",
                  borderRadius: 12,
                  padding: "16px 18px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          padding: "2px 8px",
                          background: "#FAEEDA",
                          color: "#633806",
                          borderRadius: 20,
                          fontSize: 11,
                        }}
                      >
                        {r.category}
                      </span>
                      <span style={{ fontSize: 11, color: "#aaa" }}>
                        par {r.reporter.username}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        margin: "0 0 6px",
                      }}
                    >
                      {r.title}
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#555",
                        margin: 0,
                        lineHeight: 1.6,
                      }}
                    >
                      {r.description}
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    <button
                      onClick={() => handleScam(r.id, "verified")}
                      style={{
                        padding: "6px 14px",
                        background: "#E1F5EE",
                        color: "#085041",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 12,
                        cursor: "pointer",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <Check size={12} /> Valider
                    </button>
                    <button
                      onClick={() => handleScam(r.id, "rejected")}
                      style={{
                        padding: "6px 14px",
                        background: "#FCEBEB",
                        color: "#791F1F",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 12,
                        cursor: "pointer",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <X size={12} /> Rejeter
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tips */}
      {tab === "tips" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tips.length === 0 ? (
            <p
              style={{
                color: "#aaa",
                fontSize: 13,
                textAlign: "center",
                padding: 30,
              }}
            >
              Aucun tip en attente
            </p>
          ) : (
            tips.map((t) => (
              <div
                key={t.id}
                style={{
                  background: "#fff",
                  border: "0.5px solid #EAEAE8",
                  borderRadius: 12,
                  padding: "16px 18px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 20,
                          fontSize: 11,
                          background: t.type === "tip" ? "#FAEEDA" : "#E6F1FB",
                          color: t.type === "tip" ? "#633806" : "#0C447C",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {t.type === "tip" ? (
                          <>
                            <Lightbulb size={11} /> Bon plan
                          </>
                        ) : (
                          <>
                            <BookOpen size={11} /> Témoignage
                          </>
                        )}
                      </span>
                      <span style={{ fontSize: 11, color: "#aaa" }}>
                        {t.author.username} · {t.author.originTerritory}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        margin: "0 0 6px",
                      }}
                    >
                      {t.title}
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#555",
                        margin: 0,
                        lineHeight: 1.6,
                      }}
                    >
                      {t.content}
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    <button
                      onClick={() => handleTip(t.id, true)}
                      style={{
                        padding: "6px 14px",
                        background: "#E1F5EE",
                        color: "#085041",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 12,
                        cursor: "pointer",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <Check size={12} /> Approuver
                    </button>
                    <button
                      onClick={() => handleTip(t.id, false)}
                      style={{
                        padding: "6px 14px",
                        background: "#FCEBEB",
                        color: "#791F1F",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 12,
                        cursor: "pointer",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <X size={12} /> Refuser
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
