import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuthStore } from "../stores/authStore";

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

export const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [tab, setTab] = useState<"followers" | "following">("followers");
  const [list, setList] = useState<FollowUser[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const isOwn = id === currentUser?.id;

  useEffect(() => {
    if (!id) return;
    api
      .get(`/users/${id}`)
      .then((r) => {
        setProfile(r.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/users/${id}/${tab}`)
      .then((r) => {
        setList(r.data);
        setListLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setListLoading(false);
      });
  }, [id, tab]);

  const handleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      if (profile.isFollowing) {
        await api.delete(`/users/${profile.id}/follow`);
        setProfile((p) =>
          p
            ? {
                ...p,
                isFollowing: false,
                _count: { ...p._count, followers: p._count.followers - 1 },
              }
            : p,
        );
      } else {
        await api.post(`/users/${profile.id}/follow`);
        setProfile((p) =>
          p
            ? {
                ...p,
                isFollowing: true,
                _count: { ...p._count, followers: p._count.followers + 1 },
              }
            : p,
        );
      }
    } catch (err) {
      console.error(err);
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
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: 60,
          color: "#aaa",
          fontSize: 14,
        }}
      >
        Chargement...
      </div>
    );
  }
  if (!profile) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <p>Profil introuvable.</p>
        <button onClick={() => navigate(-1)}>← Retour</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px" }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          fontSize: 12,
          color: "#888",
          border: "none",
          background: "none",
          cursor: "pointer",
          marginBottom: 16,
        }}
      >
        ← Retour
      </button>

      {/* Carte profil */}
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #EAEAE8",
          borderRadius: 16,
          padding: 20,
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          {/* Avatar */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "#E1F5EE",
              color: "#085041",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 500,
              flexShrink: 0,
              overflow: "hidden",
              border: "2px solid #E1F5EE",
            }}
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              profile.username[0].toUpperCase()
            )}
          </div>

          {/* Infos */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 10,
              }}
            >
              <h1 style={{ fontSize: 17, fontWeight: 500, margin: 0 }}>
                {profile.username}
              </h1>
              {!isOwn && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  style={{
                    padding: "6px 18px",
                    fontSize: 12,
                    fontWeight: 500,
                    border: profile.isFollowing ? "0.5px solid #ddd" : "none",
                    background: profile.isFollowing ? "#fff" : "#1D9E75",
                    color: profile.isFollowing ? "#444" : "#fff",
                    borderRadius: 20,
                    cursor: "pointer",
                    opacity: followLoading ? 0.6 : 1,
                    transition: "all .2s",
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
                    padding: "6px 14px",
                    fontSize: 12,
                    border: "0.5px solid #ddd",
                    background: "#fff",
                    borderRadius: 20,
                    cursor: "pointer",
                  }}
                >
                  Modifier le profil
                </button>
              )}
            </div>

            {/* Compteurs Instagram-style */}
            <div style={{ display: "flex", gap: 20, marginBottom: 10 }}>
              {[
                { val: profile._count.posts, label: "posts" },
                { val: profile._count.followers, label: "abonnés" },
                { val: profile._count.following, label: "abonnements" },
              ].map(({ val, label }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>
                    {val}
                  </p>
                  <p style={{ fontSize: 11, color: "#888", margin: 0 }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 13, color: "#555", margin: "0 0 2px" }}>
              🌏 {profile.originTerritory}
            </p>
            {profile.currentCity && (
              <p style={{ fontSize: 13, color: "#888", margin: "0 0 4px" }}>
                📍 {profile.currentCity}
              </p>
            )}
            {profile.bio && (
              <p style={{ fontSize: 13, lineHeight: 1.6, marginTop: 6 }}>
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {!isOwn && (
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button
              onClick={startConversation}
              style={{
                flex: 1,
                padding: 10,
                background: "#fff",
                border: "0.5px solid #EAEAE8",
                borderRadius: 10,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              💬 Envoyer un message
            </button>
          </div>
        )}
      </div>

      {/* Onglets Abonnés / Abonnements */}
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #EAEAE8",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", borderBottom: "0.5px solid #EAEAE8" }}>
          {(["followers", "following"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: "12px 0",
                fontSize: 13,
                fontWeight: tab === t ? 500 : 400,
                border: "none",
                background: "none",
                cursor: "pointer",
                borderBottom:
                  tab === t ? "2px solid #1D9E75" : "2px solid transparent",
                color: tab === t ? "#1D9E75" : "#888",
              }}
            >
              {t === "followers" ? "Abonnés" : "Abonnements"} (
              {t === "followers"
                ? profile._count.followers
                : profile._count.following}
              )
            </button>
          ))}
        </div>

        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          {listLoading ? (
            <div
              style={{
                textAlign: "center",
                padding: 20,
                color: "#aaa",
                fontSize: 13,
              }}
            >
              Chargement...
            </div>
          ) : list.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 20,
                color: "#aaa",
                fontSize: 13,
              }}
            >
              {tab === "followers"
                ? "Aucun abonné pour l'instant"
                : "Ne suit personne pour l'instant"}
            </div>
          ) : (
            list.map((u) => (
              <button
                key={u.id}
                onClick={() => navigate(`/profile/${u.id}`)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  border: "none",
                  borderBottom: "0.5px solid #F5F5F3",
                  background: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
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
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
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
                  <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>
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
      </div>
    </div>
  );
};
